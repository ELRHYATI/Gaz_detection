import { ref, onValue, off, get } from 'firebase/database';
import { database } from '../config/firebase';
import { setSystemStatus, appendSystemLog } from '../utils/firebase';

export interface InactivityMonitorOptions {
  timeoutMs?: number; // default 30 minutes
  verifyIntegrity?: boolean; // default true
  pollIntervalMs?: number; // how often to check inactivity, default 10s
}

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const isValidGasPayload = (node: any) => {
  if (!node || typeof node !== 'object') return false;
  const g = node.gasLevel ?? node.gaz ?? node.gas ?? node.value ?? node.concentration;
  const ts = node.timestamp ?? node.time ?? node.ts;
  return isFiniteNumber(Number(g)) && isFiniteNumber(Number(ts)) && Number(ts) > 946684800000; // > year 2000
};

export const startInactivityMonitor = (opts?: InactivityMonitorOptions) => {
  const timeoutMs = opts?.timeoutMs ?? 30 * 60 * 1000; // 30 min
  const verifyIntegrity = opts?.verifyIntegrity ?? true;
  const pollIntervalMs = opts?.pollIntervalMs ?? 10_000;

  let lastValidTs = Date.now();
  let manualOverride = false;
  let currentStatus: 'active' | 'inactive' = 'active';
  let interval: any;

  const latestRef = ref(database, 'latestReading');
  const sensorsRef = ref(database, 'capteurs');
  const overrideRef = ref(database, 'system/manual_override');

  const trySetStatus = async (next: 'active' | 'inactive', reason: string) => {
    if (currentStatus === next) return;
    currentStatus = next;
    try {
      await setSystemStatus(next, 'service/inactivityMonitor');
      await appendSystemLog({ event: next === 'inactive' ? 'auto_inactive' : 'data_active', status: next, timestamp: Date.now(), actor: 'service/inactivityMonitor', details: { reason } });
    } catch (e) {
      console.error('Failed to set system status', e);
    }
  };

  const handleLatest = (snap: any) => {
    const val = snap?.val?.();
    if (!val) return;
    const ok = verifyIntegrity ? isValidGasPayload(val) : true;
    const ts = Number(val?.timestamp ?? val?.time ?? val?.ts ?? Date.now());
    if (ok) {
      lastValidTs = ts;
      if (currentStatus === 'inactive') {
        trySetStatus('active', 'valid_latestReading');
      }
    }
  };

  const handleSensors = (snap: any) => {
    const s = snap?.val?.();
    if (!s || typeof s !== 'object') return;
    const mq2Node = (s as any).MQ2 ?? (s as any).mq2;
    const ts = (s as any).timestamp ?? (s as any).time ?? (s as any).ts;
    const g = typeof mq2Node === 'object' && mq2Node !== null ? (mq2Node.concentration ?? mq2Node.value ?? mq2Node.level) : mq2Node;
    const ok = verifyIntegrity ? isFiniteNumber(Number(g)) && isFiniteNumber(Number(ts)) : true;
    if (ok) {
      lastValidTs = Number(ts);
      if (currentStatus === 'inactive') {
        trySetStatus('active', 'valid_capteurs');
      }
    }
  };

  const handleOverride = (snap: any) => {
    const val = !!snap?.val?.();
    manualOverride = val;
    if (manualOverride) {
      trySetStatus('active', 'manual_override_enabled');
    }
  };

  const checkInactivity = async () => {
    if (manualOverride) return; // respect override
    const now = Date.now();
    const diff = now - lastValidTs;
    if (diff >= timeoutMs) {
      await trySetStatus('inactive', `inactivity_timeout_${timeoutMs}ms`);
    }
  };

  // Prime lastValidTs from DB on start for persistence after restarts
  (async () => {
    try {
      const latestSnap = await get(latestRef);
      const sensorsSnap = await get(sensorsRef);
      const candidates: number[] = [];
      const l = latestSnap?.val?.();
      if (l && isValidGasPayload(l)) candidates.push(Number(l.timestamp ?? l.time ?? l.ts));
      const s = sensorsSnap?.val?.();
      const ts = s?.timestamp ?? s?.time ?? s?.ts;
      if (isFiniteNumber(Number(ts))) candidates.push(Number(ts));
      if (candidates.length) lastValidTs = Math.max(...candidates);
    } catch (e) {
      console.warn('Inactivity priming failed; using Date.now()', e);
    }
  })();

  // Subscriptions
  onValue(latestRef, handleLatest, (err) => console.error('latestReading subscribe error:', err));
  onValue(sensorsRef, handleSensors, (err) => console.error('capteurs subscribe error:', err));
  onValue(overrideRef, handleOverride, (err) => console.error('manual_override subscribe error:', err));

  interval = setInterval(checkInactivity, pollIntervalMs);

  // Return cleanup to caller
  return () => {
    off(latestRef); off(sensorsRef); off(overrideRef);
    if (interval) clearInterval(interval);
  };
};

export default startInactivityMonitor;