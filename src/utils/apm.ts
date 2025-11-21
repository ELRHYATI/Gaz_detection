import { performance as perfInstance } from '../config/firebase';
import type { FirebasePerformance } from '@firebase/performance-types';

type TraceLike = {
  start: () => void;
  stop: () => void;
  putMetric?: (name: string, value: number) => void;
  putAttribute?: (name: string, value: string) => void;
};

const getPerf = (): FirebasePerformance | undefined => {
  return (perfInstance as any) as FirebasePerformance | undefined;
};

export const startTrace = (name: string, attrs?: Record<string, string>): TraceLike | null => {
  try {
    const perf = getPerf();
    if (!perf) return null;
    // dynamic import-free: access modular trace via (perf as any).trace
    const t: TraceLike = (perf as any).trace ? (perf as any).trace(name) : (window as any).firebase?.performance?.trace?.(name);
    if (!t) return null;
    if (attrs && t.putAttribute) {
      Object.entries(attrs).forEach(([k, v]) => t.putAttribute!(k, String(v)));
    }
    t.start();
    return t;
  } catch {
    return null;
  }
};

export const measureAsync = async <T>(name: string, fn: () => Promise<T>, attrs?: Record<string, string>) => {
  const t = startTrace(name, attrs);
  try {
    const res = await fn();
    return res;
  } finally {
    try { t?.stop(); } catch {}
  }
};

// --- Lightweight in-memory store for UI consumption ---
export type ApmMetrics = {
  lcp?: number;
  cls?: number;
  fid?: number;
  fcp?: number;
  updatedAt?: number;
};

let metrics: ApmMetrics = {};
const listeners: Array<(m: ApmMetrics) => void> = [];
const notify = () => {
  const snapshot = { ...metrics, updatedAt: Date.now() };
  listeners.forEach((cb) => { try { cb(snapshot); } catch {} });
};

export const subscribeMetrics = (cb: (m: ApmMetrics) => void) => {
  listeners.push(cb);
  try { cb({ ...metrics, updatedAt: metrics.updatedAt ?? Date.now() }); } catch {}
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
};

export const getCurrentMetrics = (): ApmMetrics => ({ ...metrics });

// Lightweight Web Vitals (LCP, CLS, FID/FIP, FCP) using PerformanceObserver
export const recordWebVitals = () => {
  try {
    const perf = getPerf();
    if (!perf || typeof PerformanceObserver === 'undefined') return;

    // Create a single trace to aggregate metrics
    const trace = startTrace('web_vitals');

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as any;
      const lcp = last?.renderTime || last?.loadTime || last?.startTime || 0;
      trace?.putMetric?.('LCP', Math.round(lcp));
      metrics.lcp = Math.round(lcp);
      notify();
    });
    try { lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true } as any); } catch {}

    // Cumulative Layout Shift
    let clsTotal = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any) {
        if (!entry.hadRecentInput) clsTotal += entry.value || 0;
      }
      const cls = Math.round(clsTotal * 1000) / 1000;
      trace?.putMetric?.('CLS', cls);
      metrics.cls = cls;
      notify();
    });
    try { clsObserver.observe({ type: 'layout-shift', buffered: true } as any); } catch {}

    // First Input Delay (first-input)
    const fidObserver = new PerformanceObserver((list) => {
      const first = list.getEntries()[0] as any;
      const fid = (first?.processingStart || 0) - (first?.startTime || 0);
      trace?.putMetric?.('FID', Math.round(fid));
      metrics.fid = Math.round(fid);
      notify();
      try { fidObserver.disconnect(); } catch {}
    });
    try { fidObserver.observe({ type: 'first-input', buffered: true } as any); } catch {}

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const fcpEntry = list.getEntries().find((e) => (e as any).name === 'first-contentful-paint') as PerformanceEntry | undefined;
      const fcp = fcpEntry ? Math.round(fcpEntry.startTime) : 0;
      trace?.putMetric?.('FCP', fcp);
      metrics.fcp = fcp;
      notify();
      try { fcpObserver.disconnect(); } catch {}
    });
    try { fcpObserver.observe({ type: 'paint', buffered: true } as any); } catch {}

    // Close trace on page hide to flush metrics
    const onHide = () => { try { trace?.stop(); } catch {} };
    window.addEventListener('pagehide', onHide, { once: true });
  } catch {
    // ignore
  }
};

// Helper to mark route navigation
export const markNavigation = (route: string) => {
  try {
    const t = startTrace('navigation', { route });
    setTimeout(() => { try { t?.stop(); } catch {} }, 300);
  } catch {}
};

export default { startTrace, measureAsync, recordWebVitals, markNavigation };