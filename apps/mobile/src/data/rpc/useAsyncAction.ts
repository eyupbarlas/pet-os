// Loading / error state for online-only calls (mobile.md 5). The error is a stable code that the
// screen maps to `app.error.<code>`; "offline" means the call needs a connection.
import { useCallback, useRef, useState } from 'react';
import type { RpcError, RpcErrorCode } from './household';

export function useAsyncAction() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<RpcErrorCode | null>(null);
  const live = useRef(true);

  /** Runs `fn`; returns its result, or undefined when it failed (the error is in `error`). */
  const run = useCallback(async <T,>(key: string, fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(key);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError((e as RpcError).code ?? 'unknown');
      return undefined;
    } finally {
      if (live.current) setBusy(null);
    }
  }, []);

  return { busy, error, run, setError, clear: useCallback(() => setError(null), []) };
}
