"use client";

import * as React from "react";
import { formatDateTime, relativeTime } from "./format";

const subscribe = () => () => {};

/**
 * "3 min ago" after hydration; the absolute IST timestamp during SSR and the
 * first client render, so server and browser output always match.
 */
export function RelativeTime({ iso, className }: { iso: string | null | undefined; className?: string }) {
  const mounted = React.useSyncExternalStore(subscribe, () => true, () => false);
  if (!iso) return <span className={className}>—</span>;
  return (
    <time dateTime={iso} title={formatDateTime(iso)} className={className}>
      {mounted ? relativeTime(iso) : formatDateTime(iso)}
    </time>
  );
}
