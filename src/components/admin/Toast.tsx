"use client";

import * as React from "react";
import { CheckCircle2, Info, X, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  title?: string;
  description?: React.ReactNode;
  variant?: ToastVariant;
  /** ms; 0 = sticky */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends Required<Pick<ToastOptions, "variant" | "duration">> {
  id: number;
  title?: string;
  description?: React.ReactNode;
  action?: ToastOptions["action"];
}

interface ToastApi {
  show: (opts: ToastOptions) => number;
  success: (title: string, description?: React.ReactNode) => number;
  error: (title: string, description?: React.ReactNode) => number;
  info: (title: string, description?: React.ReactNode) => number;
  warning: (title: string, description?: React.ReactNode) => number;
  dismiss: (id: number) => void;
}

const ToastContext = React.createContext<ToastApi | null>(null);

const ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};
const COLORS: Record<ToastVariant, string> = {
  success: "border-success/40 text-success",
  error: "border-danger/40 text-danger",
  info: "border-info/40 text-info",
  warning: "border-warning/40 text-warning",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const counter = React.useRef(0);
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = React.useCallback(
    (opts: ToastOptions) => {
      const id = ++counter.current;
      const item: ToastItem = {
        id,
        title: opts.title,
        description: opts.description,
        action: opts.action,
        variant: opts.variant ?? "info",
        duration: opts.duration ?? (opts.variant === "error" ? 7000 : 4000),
      };
      setItems((list) => [...list.slice(-4), item]);
      if (item.duration > 0) timers.current.set(id, setTimeout(() => dismiss(id), item.duration));
      return id;
    },
    [dismiss],
  );

  React.useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  const api = React.useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      success: (title, description) => show({ title, description, variant: "success" }),
      error: (title, description) => show({ title, description, variant: "error" }),
      info: (title, description) => show({ title, description, variant: "info" }),
      warning: (title, description) => show({ title, description, variant: "warning" }),
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px]"
      >
        {items.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              role={t.variant === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-surface/95 px-4 py-3 text-sm shadow-card backdrop-blur-md animate-fade-up",
                COLORS[t.variant],
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1 text-text-2">
                {t.title && <p className="font-semibold text-text">{t.title}</p>}
                {t.description && <div className={cn("text-text-3", t.title && "mt-0.5")}>{t.description}</div>}
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick();
                      dismiss(t.id);
                    }}
                    className="mt-2 text-xs font-semibold text-lavender hover:text-primary"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="-mr-1 rounded-md p-1 text-text-3 transition-colors hover:bg-white/5 hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
