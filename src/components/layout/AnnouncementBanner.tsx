"use client";

import * as React from "react";
import { Megaphone, X } from "lucide-react";

const KEY = "muj:banner-dismissed";
const noopSubscribe = () => () => {};

function readDismissed(): string {
  try {
    return window.sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

/** Site-wide banner from siteSettings.announcementBanner; dismissible per browser session. */
export function AnnouncementBanner({ message }: { message: string | null }) {
  // null on the server → banner renders only after hydration, avoiding a flash for users who dismissed it.
  const stored = React.useSyncExternalStore(noopSubscribe, readDismissed, () => null);
  const [dismissedNow, setDismissedNow] = React.useState<string | null>(null);

  if (!message || stored === null || stored === message || dismissedNow === message) return null;

  const dismiss = () => {
    setDismissedNow(message);
    try {
      window.sessionStorage.setItem(KEY, message);
    } catch {
      /* ignore */
    }
  };

  return (
    <div role="status" className="border-b border-primary/30 bg-primary/10">
      <div className="container-page flex items-center gap-3 py-2 text-sm text-text">
        <Megaphone className="h-4 w-4 shrink-0 text-lavender" aria-hidden />
        <p className="min-w-0 flex-1">{message}</p>
        <button type="button" onClick={dismiss} aria-label="Dismiss announcement" className="rounded-md p-1 text-text-3 transition-colors hover:bg-white/10 hover:text-text">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
