import { useEffect, useRef, useState } from 'react';
import { calculateAlertLevel } from '../utils/alerts';
import { subscribeToThreshold, appendAlertLog, acknowledgeAlertLog, upsertActiveAlert, dismissActiveAlert } from '../utils/firebase';
import { useLatestReadingRealtime } from './useLatestReadingRealtime';
import type { GasReading, Threshold } from '../types';
import { APP_CONFIG } from '../config/app';

type Severity = 'warning' | 'danger' | 'critical';
type Param = 'gas' | 'humidity' | 'temperature';

export interface ActiveAlert {
  id: string;
  severity: Severity;
  parameter: Param;
  value: number;
  threshold: Partial<Threshold>;
  location: string;
  message: string;
  timestamp: number;
  expiresAt?: number;
}

const playTone = (severity: Severity) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const conf = APP_CONFIG.alerts.sound[severity];
    osc.type = 'sine';
    osc.frequency.value = conf.frequency;
    gain.gain.value = 0.15; // quiet but audible
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, conf.duration);
  } catch {}
};

const vibratePattern = (severity: Severity): number[] => {
  switch (severity) {
    case 'critical':
      return [400, 150, 400, 150, 400];
    case 'danger':
      return [300, 150, 300];
    default:
      return [200];
  }
};

export const useAlertsEngine = () => {
  const { reading } = useLatestReadingRealtime();
  const [threshold, setThreshold] = useState<Threshold | null>(null);
  const [active, setActive] = useState<ActiveAlert | null>(null);
  const lastAlertIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToThreshold((t) => setThreshold(t));
    return () => unsub();
  }, []);

  const evaluate = (reading: GasReading | null, t: Threshold | null): ActiveAlert | null => {
    if (!reading || !t) return null;
    const level = calculateAlertLevel(reading, t);
    if (level.level === 'safe') return null;

    // Determine which parameter is at fault with priority: critical gas > any exceeding
    const { gasLevel, humidity, temperature } = reading;
    const paramExceeds: Array<{ p: Param; val: number; sev: Severity }> = [];

    // Gas
    if (gasLevel > t.gasMax * 1.5) paramExceeds.push({ p: 'gas', val: gasLevel, sev: 'critical' });
    else if (gasLevel > t.gasMax || gasLevel < t.gasMin) paramExceeds.push({ p: 'gas', val: gasLevel, sev: 'danger' });
    // Humidity
    if (humidity > t.humidityMax || humidity < t.humidityMin) paramExceeds.push({ p: 'humidity', val: humidity, sev: 'danger' });
    // Temperature
    if (temperature > t.temperatureMax || temperature < t.temperatureMin) paramExceeds.push({ p: 'temperature', val: temperature, sev: 'danger' });

    let chosen = paramExceeds[0];
    // prioritize most severe
    if (paramExceeds.length > 1) {
      chosen = paramExceeds.reduce((acc, cur) => {
        const rank = (s: Severity) => (s === 'critical' ? 3 : s === 'danger' ? 2 : 1);
        return rank(cur.sev) > rank(acc.sev) ? cur : acc;
      });
    }
    const severity: Severity = chosen?.sev || (level.level as Severity);
    const parameter: Param = chosen?.p || 'gas';
    const value = chosen?.val ?? gasLevel;
    const ts = reading.timestamp;
    const loc = reading.location || APP_CONFIG.locationLabel;
    const message = level.message;

    const fingerprint = `${parameter}:${severity}`;
    return {
      id: `${fingerprint}-${ts}`,
      severity,
      parameter,
      value,
      threshold: t,
      location: loc,
      message,
      timestamp: ts,
    };
  };

  useEffect(() => {
    const alert = evaluate(reading || null, threshold);
    if (!alert) {
      // if we previously had an active danger alert, mark resolved with context
      if (active && active.severity === 'danger') {
        const fp = `${active.parameter}:${active.severity}`;
        void dismissActiveAlert(fp, 'resolved', { severity: active.severity, parameter: active.parameter, value: active.value, message: 'Resolved before expiry' });
      }
      setActive(null);
      return;
    }

    // Persist active alert with expiry (10 min) and dedupe within window
    const fp = `${alert.parameter}:${alert.severity}`;
    void (async () => {
      const persisted = await upsertActiveAlert(fp, {
        severity: alert.severity,
        parameter: alert.parameter,
        value: alert.value,
        location: alert.location,
        message: alert.message,
      });
      // Skip showing if dismissed within window
      if (persisted.dismissed && persisted.expires_at > Date.now()) {
        return;
      }
      const stableId = `${fp}-${persisted.started_at}`;
      setActive(() => {
        const next: ActiveAlert = { ...alert, id: stableId, expiresAt: persisted.expires_at };
        // trigger side effects only for new alerts based on started_at
        if (lastAlertIdRef.current !== stableId) {
          lastAlertIdRef.current = stableId;
          // play sound
          playTone(alert.severity);
          // vibrate optional
          if (APP_CONFIG.alerts.enableVibration && 'vibrate' in navigator) {
            try { navigator.vibrate(vibratePattern(alert.severity)); } catch {}
          }
          // log initial occurrence
          void appendAlertLog({
            timestamp: alert.timestamp,
            severity: alert.severity,
            parameter: alert.parameter,
            value: alert.value,
            threshold: {
              gasMin: threshold?.gasMin,
              gasMax: threshold?.gasMax,
              humidityMin: threshold?.humidityMin,
              humidityMax: threshold?.humidityMax,
              temperatureMin: threshold?.temperatureMin,
              temperatureMax: threshold?.temperatureMax,
            },
            location: alert.location,
            message: alert.message,
            acknowledged: false,
          });

          // Server-side notifications are enabled; avoid duplicate client sends.
        }
        return next;
      });
    })();
  }, [reading, threshold]);

  const acknowledge = async () => {
    if (active) {
      // mark acknowledged and clear and persist manual dismissal
      await acknowledgeAlertLog(active.id).catch(() => {});
      const fp = `${active.parameter}:${active.severity}`;
      await dismissActiveAlert(fp, 'manual', { severity: active.severity, parameter: active.parameter, value: active.value, message: 'Manual dismissal' }).catch(() => {});
      setActive(null);
    }
  };

  return { activeAlert: active, acknowledge };
};