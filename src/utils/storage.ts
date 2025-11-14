export type StorageKind = 'local' | 'session';

interface MemoryStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  length: number;
}

const createMemoryStore = (): MemoryStore => {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() { return map.size; },
  };
};

const isQuotaError = (err: unknown): boolean => {
  // Detect QuotaExceededError across browsers
  return !!(
    err &&
    typeof err === 'object' &&
    (((err as any).name === 'QuotaExceededError') || (err as any).code === 22)
  );
};

const getNativeStorage = (kind: StorageKind): Storage | null => {
  try {
    if (kind === 'local') return window.localStorage;
    return window.sessionStorage;
  } catch (_) {
    return null;
  }
};

export interface SafeStorage {
  kind: StorageKind | 'memory';
  get(key: string): string | null;
  set(key: string, value: string): boolean; // returns success
  remove(key: string): void;
  keys(prefix?: string): string[];
}

export const createSafeStorage = (preferred: StorageKind = 'local', namespace = 'app:'): SafeStorage => {
  const native = getNativeStorage(preferred);
  const fallbackNative = getNativeStorage(preferred === 'local' ? 'session' : 'local');
  const memory = createMemoryStore();

  const choose = (s: Storage | MemoryStore | null): { store: Storage | MemoryStore; kind: SafeStorage['kind'] } => {
    if (s) return { store: s, kind: preferred };
    if (fallbackNative) return { store: fallbackNative, kind: preferred === 'local' ? 'session' : 'local' };
    return { store: memory, kind: 'memory' };
  };

  let current = choose(native);

  const api: SafeStorage = {
    kind: current.kind,
    get(key) {
      try {
        return (current.store as any).getItem(namespace + key);
      } catch (err) {
        console.warn('[storage] get failed', err);
        return null;
      }
    },
    set(key, value) {
      try {
        (current.store as any).setItem(namespace + key, value);
        return true;
      } catch (err) {
        if (isQuotaError(err)) {
          // Quota exceeded -> attempt simple eviction of same namespace, else fall back
          try {
            const keys = api.keys();
            for (const k of keys.slice(0, Math.max(1, Math.floor(keys.length / 2)))) {
              (current.store as any).removeItem(k);
            }
            (current.store as any).setItem(namespace + key, value);
            return true;
          } catch (_) {
            // Fall back to weaker storage or memory
            const next = choose(current.kind === 'local' ? fallbackNative ?? null : native ?? null);
            current = next;
            api.kind = next.kind;
            try {
              (current.store as any).setItem(namespace + key, value);
              return true;
            } catch (err2) {
              console.warn('[storage] fallback set failed', err2);
              return false;
            }
          }
        }
        console.warn('[storage] set failed', err);
        return false;
      }
    },
    remove(key) {
      try {
        (current.store as any).removeItem(namespace + key);
      } catch (err) {
        console.warn('[storage] remove failed', err);
      }
    },
    keys(prefix = namespace) {
      try {
        const out: string[] = [];
        const len = (current.store as any).length ?? 0;
        for (let i = 0; i < len; i++) {
          const k = (current.store as any).key(i);
          if (k && k.startsWith(prefix)) out.push(k);
        }
        return out;
      } catch (err) {
        console.warn('[storage] keys failed', err);
        return [];
      }
    },
  };

  return api;
};

export const safeJSONParse = <T>(raw: string | null, validate?: (x: any) => x is T): T | null => {
  if (!raw) return null;
  try {
    const val = JSON.parse(raw);
    if (validate && !validate(val)) return null;
    return val as T;
  } catch (err) {
    console.warn('[storage] parse failed', err);
    return null;
  }
};

export const safeJSONStringify = (val: unknown): string => {
  try {
    return JSON.stringify(val);
  } catch (err) {
    console.warn('[storage] stringify failed', err);
    return 'null';
  }
};