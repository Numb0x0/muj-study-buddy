"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Props {
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
  className?: string;
}

/** Replaces window.confirm: an inline confirmation strip with explicit buttons. */
export function ConfirmInline({ message, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel, loading, danger = true, className }: Props) {
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    confirmRef.current?.focus();
  }, []);
  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2 text-sm",
        danger ? "border-danger/40 bg-danger/10" : "border-warning/40 bg-warning/10",
        className,
      )}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <AlertTriangle className={cn("h-4 w-4 shrink-0", danger ? "text-danger" : "text-warning")} aria-hidden />
      <span className="min-w-0 flex-1 text-text-2">{message}</span>
      <div className="flex items-center gap-2">
        <Button ref={confirmRef as never} size="sm" variant={danger ? "danger" : "primary"} loading={loading} onClick={() => void onConfirm()}>
          {confirmLabel}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}
