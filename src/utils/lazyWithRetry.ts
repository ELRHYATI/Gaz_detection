import React from 'react';

// Wrap React.lazy() to automatically retry once on transient chunk load errors.
// If the retry fails due to a network/caching issue, optionally force a hard reload.
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  options: { maxAttempts?: number; onFail?: (error: unknown) => void; hardReloadOnChunkError?: boolean } = {}
) {
  const { maxAttempts = 2, onFail, hardReloadOnChunkError = true } = options;
  let attempts = 0;

  const load = (): Promise<{ default: T }> => {
    attempts += 1;
    return importer().catch((err: any) => {
      const message = String(err?.message || err);
      const isChunkLoadError = /Loading chunk \d+ failed|Failed to fetch dynamically imported module/i.test(message);
      const canRetry = attempts < maxAttempts;

      if (canRetry) {
        // Small delay before retry to give dev server a moment
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            load().then(resolve).catch(reject);
          }, 300);
        });
      }

      if (isChunkLoadError && hardReloadOnChunkError && typeof window !== 'undefined') {
        try { onFail?.(err); } catch {}
        // Force a hard reload to recover from stale client cache
        window.location.reload();
      }
      throw err;
    });
  };

  return React.lazy(load);
}

export default lazyWithRetry;