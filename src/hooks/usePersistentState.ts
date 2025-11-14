import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSafeStorage, safeJSONParse, safeJSONStringify } from '../utils/storage';
import type { StorageKind } from '../utils/storage';

export interface PersistentOptions<T> {
  storage?: StorageKind; // default 'local'
  namespace?: string; // default 'app:'
  validate?: (x: any) => x is T; // schema validator
  serialize?: (x: T) => string; // default JSON.stringify
  deserialize?: (raw: string | null) => T | null; // default JSON.parse
  syncAcrossTabs?: boolean; // default true
}

export const usePersistentState = <T>(
  key: string,
  initial: T,
  options: PersistentOptions<T> = {}
) => {
  const {
    storage = 'local',
    namespace = 'app:',
    validate,
    serialize,
    deserialize,
    syncAcrossTabs = true,
  } = options;

  const safe = useMemo(() => createSafeStorage(storage, namespace), [storage, namespace]);
  const serializer = useCallback((x: T) => (serialize ? serialize(x) : safeJSONStringify(x)), [serialize]);
  const deserializer = useCallback(
    (raw: string | null) => {
      if (deserialize) return deserialize(raw);
      return safeJSONParse<T>(raw, validate);
    },
    [deserialize, validate]
  );

  const firstLoad = useRef(true);
  const [value, setValue] = useState<T>(() => {
    const raw = safe.get(key);
    const parsed = deserializer(raw);
    return parsed ?? initial;
  });

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    safe.set(key, serializer(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (!syncAcrossTabs || safe.kind === 'memory') return;
    const handler = (e: StorageEvent) => {
      // Only react to our namespace + key
      if (!e.key || !e.key.endsWith(key)) return;
      const next = deserializer(e.newValue);
      if (next !== null) setValue(next);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, deserializer, syncAcrossTabs, safe.kind]);

  return [value, setValue] as const;
};