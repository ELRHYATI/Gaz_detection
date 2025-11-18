import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mocks for firebase/database
const handlers: Record<string, Function[]> = {};
let gets: Record<string, any> = {};

vi.mock('firebase/database', () => ({
  ref: (_db: any, path: string) => ({ path }),
  onValue: (r: any, cb: Function) => { (handlers[r.path] ||= []).push(cb); },
  off: (r: any) => { handlers[r.path] = []; },
  get: (r: any) => ({ val: () => gets[r.path] })
}));

// Mock config/firebase
vi.mock('../src/config/firebase', () => ({ database: {} }));

// Spy on utils
const setSystemStatus = vi.fn(async () => {});
const appendSystemLog = vi.fn(async () => {});
vi.mock('../src/utils/firebase', () => ({
  setSystemStatus,
  appendSystemLog,
}));

import startInactivityMonitor from '../src/workers/inactivityMonitor';

const emit = (path: string, val: any) => {
  const list = handlers[path] || [];
  const snap = { val: () => val };
  list.forEach((cb) => cb(snap));
};

describe('inactivityMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.keys(handlers).forEach((k) => delete handlers[k]);
    setSystemStatus.mockClear();
    appendSystemLog.mockClear();
    gets = {};
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets system inactive after timeout with no data', async () => {
    const stop = startInactivityMonitor({ timeoutMs: 1000, pollIntervalMs: 100 });
    vi.advanceTimersByTime(1100);
    expect(setSystemStatus).toHaveBeenCalledWith('inactive', 'service/inactivityMonitor');
    stop();
  });

  it('returns to active on new valid latestReading data', async () => {
    const stop = startInactivityMonitor({ timeoutMs: 1000, pollIntervalMs: 100 });
    vi.advanceTimersByTime(1100);
    expect(setSystemStatus).toHaveBeenCalledWith('inactive', 'service/inactivityMonitor');
    emit('latestReading', { gasLevel: 10, humidity: 20, temperature: 30, timestamp: Date.now() });
    // let the monitor react
    await vi.advanceTimersByTimeAsync(50);
    expect(setSystemStatus).toHaveBeenCalledWith('active', 'service/inactivityMonitor');
    stop();
  });

  it('respects manual override and stays active', async () => {
    const stop = startInactivityMonitor({ timeoutMs: 1000, pollIntervalMs: 100 });
    emit('system/manual_override', true);
    vi.advanceTimersByTime(2000);
    // Should not set inactive when override is true
    const calls = setSystemStatus.mock.calls.map((c) => c[0]);
    expect(calls).not.toContain('inactive');
    stop();
  });
});