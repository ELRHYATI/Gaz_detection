import { useEffect, useRef, useState } from 'react';
import { ref, onValue, off, get } from 'firebase/database';
import { database } from '../config/firebase';
import { REALTIME_CONFIG } from '../config/realtime';
import type { GasReading } from '../types';

const isValidGasReading = (r: any): r is GasReading => {
  return r && typeof r === 'object'
    && typeof r.gasLevel === 'number'
    && typeof r.timestamp === 'number'
    && typeof r.humidity === 'number'
    && typeof r.temperature === 'number';
};

// Normalize timestamps to milliseconds since epoch (UTC)
const normalizeTimestamp = (value: unknown): number => {
  if (value == null) return Date.now();
  if (typeof value === 'number') {
    const n = value;
    // Heuristic: values less than 1e10 are likely seconds
    if (n > 0 && n < 1e10) return n * 1000;
    return n;
  }
  if (typeof value === 'string') {
    const asNum = Number(value);
    if (Number.isFinite(asNum)) return normalizeTimestamp(asNum);
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : Date.now();
  }
  return Date.now();
};

const shallowEqualReading = (a: GasReading | null, b: GasReading | null) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.gasLevel === b.gasLevel && a.humidity === b.humidity && a.temperature === b.temperature && a.timestamp === b.timestamp;
};

export const useLatestReadingRealtime = () => {
  const [reading, setReading] = useState<GasReading | null>(null);
  const [updating, setUpdating] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'realtime' | 'polling'>('realtime');
  const prevRef = useRef<GasReading | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startPollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const EARLIEST_VALID_MS = Date.UTC(2000, 0, 1); // guard against epoch-era timestamps

  useEffect(() => {
    const latestRef = ref(database, 'latestReading');
    const sensorsRef = ref(database, 'capteurs');
    const infoRef = ref(database, '.info/connected');

    const handleNew = (r: GasReading | null) => {
      if (!shallowEqualReading(prevRef.current, r)) {
        prevRef.current = r;
        setUpdating(true);
        setReading(r);
        // brief visual indicator window
        setTimeout(() => setUpdating(false), 300);
      }
    };

    onValue(latestRef, (snap) => {
      const val = snap.val();
      if (isValidGasReading(val)) {
        setMode('realtime');
        let normalized: GasReading = {
          ...val,
          timestamp: normalizeTimestamp(val.timestamp),
        };
        // Clamp unrealistically old timestamps to now
        if (normalized.timestamp < EARLIEST_VALID_MS) {
          normalized = { ...normalized, timestamp: Date.now() };
        }
        handleNew(normalized);
      }
    }, (err) => setError(err?.message || 'LatestReading error'));

    onValue(sensorsRef, (snap) => {
      if (mode !== 'realtime') return; // prefer latestReading when valid
      const s = snap.val();
      if (!s || typeof s !== 'object') return;
      const mq2Node = (s as any).MQ2 ?? (s as any).mq2;
      const mq2Raw = typeof mq2Node === 'object' && mq2Node !== null ? (mq2Node.concentration ?? mq2Node.value ?? mq2Node.level) : mq2Node;
      const tsRaw = (s as any).timestamp ?? (s as any).time ?? (s as any).ts;
      const gasLevel = typeof mq2Raw === 'number' ? mq2Raw : Number.isFinite(Number(mq2Raw)) ? Number(mq2Raw) : 0;
      let timestamp = normalizeTimestamp(tsRaw);
      if (timestamp < EARLIEST_VALID_MS) timestamp = Date.now();
      const fallback: GasReading = { id: 'compat', gasLevel, humidity: 0, temperature: 0, timestamp };
      handleNew(fallback);
    }, (err) => setError(err?.message || 'Sensors error'));

    onValue(infoRef, (snap) => {
      const connected = !!snap.val();
      if (!connected) {
        // Start polling fallback after delay
        if (startPollTimeout.current) clearTimeout(startPollTimeout.current);
        startPollTimeout.current = setTimeout(() => {
          setMode('polling');
          if (pollTimer.current) clearInterval(pollTimer.current);
          pollTimer.current = setInterval(async () => {
            try {
              const latestSnap = await get(latestRef);
              if (latestSnap.exists()) {
                const v = latestSnap.val();
                if (isValidGasReading(v)) {
                  let ts = normalizeTimestamp(v.timestamp);
                  if (ts < EARLIEST_VALID_MS) ts = Date.now();
                  handleNew({ ...v, timestamp: ts });
                }
                return;
              }
              const sensorsSnap = await get(sensorsRef);
              const s = sensorsSnap.val();
              if (s && typeof s === 'object') {
                const mq2Node = (s as any).MQ2 ?? (s as any).mq2;
                const mq2Raw = typeof mq2Node === 'object' && mq2Node !== null ? (mq2Node.concentration ?? mq2Node.value ?? mq2Node.level) : mq2Node;
                const tsRaw = (s as any).timestamp ?? (s as any).time ?? (s as any).ts;
                const gasLevel = typeof mq2Raw === 'number' ? mq2Raw : Number.isFinite(Number(mq2Raw)) ? Number(mq2Raw) : 0;
                let timestamp = normalizeTimestamp(tsRaw);
                if (timestamp < EARLIEST_VALID_MS) timestamp = Date.now();
                const fallback: GasReading = { id: 'compat', gasLevel, humidity: 0, temperature: 0, timestamp };
                handleNew(fallback);
              }
            } catch (e: any) {
              setError(e?.message || 'Polling error');
            }
          }, REALTIME_CONFIG.intervals.gas);
        }, REALTIME_CONFIG.pollingStartDelayMs);
      } else {
        // Back to realtime
        setMode('realtime');
        if (pollTimer.current) { clearInterval(pollTimer.current); pollTimer.current = null; }
        if (startPollTimeout.current) { clearTimeout(startPollTimeout.current); startPollTimeout.current = null; }
      }
    });

    return () => {
      off(latestRef); off(sensorsRef); off(infoRef);
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (startPollTimeout.current) clearTimeout(startPollTimeout.current);
    };
  }, []);

  return { reading, updating, error, mode };
};

export default useLatestReadingRealtime;