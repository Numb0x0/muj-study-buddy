"use client";

import * as React from "react";

/**
 * localStorage-backed state that is safe for SSR/hydration (the server
 * snapshot is always `initial`) and tolerant of blocked storage (private
 * windows, quota errors) via an in-memory fallback.
 *
 * Built on useSyncExternalStore so no `setState` runs inside an effect.
 */

const EVENT = "muj:persisted-state";
const memory = new Map<string, string>();

function readRaw(key: string): string | null {
  const mem = memory.get(key);
  if (mem !== undefined) return mem;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, raw: string | null) {
  if (raw === null) memory.delete(key);
  else memory.set(key, raw);
  try {
    if (raw === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, raw);
  } catch {
    /* storage unavailable — memory fallback keeps the UI working for this tab */
  }
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: key }));
}

function parse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export type Updater<T> = T | ((prev: T) => T);

export function usePersistedState<T>(key: string, initial: T): [T, (next: Updater<T>) => void, () => void] {
  // Pin the initial value so inline object literals don't churn the memo.
  const [initialValue] = React.useState(initial);

  const subscribe = React.useCallback(
    (notify: () => void) => {
      const onStorage = (e: StorageEvent) => {
        if (e.key === null || e.key === key) {
          // Another tab changed it — drop our in-memory copy so we re-read storage.
          memory.delete(key);
          notify();
        }
      };
      const onLocal = (e: Event) => {
        if ((e as CustomEvent<string>).detail === key) notify();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(EVENT, onLocal);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(EVENT, onLocal);
      };
    },
    [key],
  );

  const raw = React.useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );

  const value = React.useMemo(() => parse(raw, initialValue), [raw, initialValue]);

  const set = React.useCallback(
    (next: Updater<T>) => {
      const prev = parse(readRaw(key), initialValue);
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeRaw(key, JSON.stringify(resolved));
    },
    [key, initialValue],
  );

  const reset = React.useCallback(() => writeRaw(key, null), [key]);

  return [value, set, reset];
}

/** Collision-resistant id for client-generated rows. */
export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().slice(0, 8);
  return Math.random().toString(36).slice(2, 10);
}
