"use client";

import { useCallback, useEffect, useRef } from "react";

export interface DebouncedCallback<A extends unknown[]> {
  /** Schedule a call (replaces any pending call). */
  run: (...args: A) => void;
  /** Drop the pending call, if any. */
  cancel: () => void;
  /** Execute the pending call immediately, if any. */
  flush: () => void;
}

/**
 * Debounced version of `fn`. The latest `fn` is always used, so callers may
 * pass an inline closure without memoising it.
 */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delay = 300): DebouncedCallback<A> {
  const fnRef = useRef(fn);
  const timerRef = useRef<number | null>(null);
  const argsRef = useRef<A | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    argsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current === null || argsRef.current === null) return;
    const args = argsRef.current;
    cancel();
    fnRef.current(...args);
  }, [cancel]);

  const run = useCallback(
    (...args: A) => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      argsRef.current = args;
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        const pending = argsRef.current;
        argsRef.current = null;
        if (pending) fnRef.current(...pending);
      }, delay);
    },
    [delay],
  );

  // Clear any pending timer on unmount.
  useEffect(() => cancel, [cancel]);

  return { run, cancel, flush };
}
