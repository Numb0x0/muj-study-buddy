"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Tailwind max-width class for the panel. */
  size?: "md" | "lg";
  /** Ask before closing (e.g. unsaved changes). */
  closeGuard?: () => boolean;
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Accessible side panel: focus trap, ESC, aria-modal, scroll lock, restores focus. */
export function Drawer({ open, onClose, title, description, children, footer, size = "md", closeGuard }: DrawerProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const lastFocused = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const descId = React.useId();

  const requestClose = React.useCallback(() => {
    if (closeGuard && !closeGuard()) return;
    onClose();
  }, [closeGuard, onClose]);

  // Parents pass inline handlers, so requestClose changes every render. Keep the
  // latest in a ref; the open/focus effect must run only when `open` changes,
  // otherwise focus would jump back to the first field after every keystroke.
  const closeRef = React.useRef(requestClose);
  React.useLayoutEffect(() => {
    closeRef.current = requestClose;
  });

  React.useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFirst = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>("[data-autofocus]") ?? panel.querySelectorAll<HTMLElement>(FOCUSABLE)[1] ?? panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    };
    const raf = requestAnimationFrame(focusFirst);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lastFocused.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="presentation">
      <div className="absolute inset-0 bg-bg/70 backdrop-blur-[2px]" onClick={requestClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex h-full w-full flex-col border-l border-border bg-bg-2 shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.8)] outline-none",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-text">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-0.5 text-sm text-text-3">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close panel"
            className="-mr-2 rounded-lg p-2 text-text-3 transition-colors hover:bg-white/5 hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-bg-2 px-5 py-4 sm:px-6">{footer}</footer>}
      </div>
    </div>
  );
}
