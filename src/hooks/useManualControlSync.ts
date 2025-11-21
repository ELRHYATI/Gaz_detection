import { useEffect, useRef } from 'react';
import { subscribeToManualServo, subscribeToManualSeuil, subscribeToManualSeuilGaz, setServoAngle, applyManualGasThreshold, writeActuatorLog, subscribeToWindowControl } from '../utils/firebase';
import type { ManualServoParams, ManualThresholdParams } from '../utils/firebase';

// Smooth movement config
const SERVO_MIN = 0;
const SERVO_MAX = 180;
const STEP_DEG = 5; // degrees per step
const STEP_MS = 120; // ms between steps

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export function useManualControlSync() {
  const movingTimer = useRef<number | null>(null);
  const lastTarget = useRef<number>(0);
  const manualOverride = useRef<boolean>(false);

  useEffect(() => {
    // Track manual override flag from window control; only apply manual thresholds when enabled
    const unsubWindow = subscribeToWindowControl((ctrl) => {
      manualOverride.current = !!ctrl?.manual_override;
    }, (err) => {
      console.error('[manual-sync] window_control subscribe error', err);
    });

    // Subscribe to threshold/seuil changes
    const unsubSeuil = subscribeToManualSeuil(async (params: ManualThresholdParams | null) => {
      const v = params?.seuil_gaz;
      if (typeof v === 'undefined' || v === null) return;
      if (!manualOverride.current) return; // respect manual override flag
      await applyManualGasThreshold(v);
    }, (err) => {
      console.error('[manual-sync] seuil subscribe error', err);
      void writeActuatorLog('error: subscribe seuil');
    });

    // Subscribe to leaf value '.../seuil_gaz'
    const unsubSeuilGaz = subscribeToManualSeuilGaz(async (val) => {
      if (val === null || typeof val === 'undefined') return;
      if (!manualOverride.current) return; // respect manual override flag
      await applyManualGasThreshold(val);
    }, (err) => {
      console.error('[manual-sync] seuil_gaz subscribe error', err);
      void writeActuatorLog('error: subscribe seuil_gaz');
    });

    // Subscribe to servo manual params
    const unsubServo = subscribeToManualServo(async (params: ManualServoParams | null) => {
      if (!params) return;
      const active = params.actif === true; // default false
      if (!active) return; // ignore if automatic
      const rawPos = typeof params.position === 'number' ? params.position : Number(params.position);
      if (!Number.isFinite(rawPos)) {
        await writeActuatorLog('error: manual.servo.position invalid');
        return;
      }
      const target = clamp(rawPos, SERVO_MIN, SERVO_MAX);
      // Smoothly move towards target
      scheduleSmoothMove(target);
      // Optional: if seuil_gaz present here, apply too
      if (typeof params.seuil_gaz !== 'undefined' && params.seuil_gaz !== null) {
        if (manualOverride.current) {
          await applyManualGasThreshold(params.seuil_gaz);
        }
      }
    }, (err) => {
      console.error('[manual-sync] servo subscribe error', err);
      void writeActuatorLog('error: subscribe servo');
    });

    return () => {
      unsubWindow();
      unsubSeuil();
      unsubServo();
      unsubSeuilGaz();
      if (movingTimer.current) {
        window.clearInterval(movingTimer.current);
        movingTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleSmoothMove = (target: number) => {
    const start = lastTarget.current;
    if (start === target) return;
    if (movingTimer.current) {
      window.clearInterval(movingTimer.current);
      movingTimer.current = null;
    }
    const direction = target > start ? 1 : -1;
    let cursor = start;
    movingTimer.current = window.setInterval(async () => {
      cursor = clamp(cursor + direction * STEP_DEG, SERVO_MIN, SERVO_MAX);
      try {
        await setServoAngle(cursor);
      } catch {
        // ignore transient write errors
      }
      lastTarget.current = cursor;
      if (cursor === target) {
        if (movingTimer.current) {
          window.clearInterval(movingTimer.current);
          movingTimer.current = null;
        }
      }
    }, STEP_MS);
  };
}

export default useManualControlSync;