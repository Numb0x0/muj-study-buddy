import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warning" | "danger";

const styles: Record<AlertVariant, { box: string; Icon: React.ComponentType<{ className?: string }> }> = {
  info: { box: "border-info/30 bg-info/10 text-info", Icon: Info },
  success: { box: "border-success/30 bg-success/10 text-success", Icon: CheckCircle2 },
  warning: { box: "border-warning/30 bg-warning/10 text-warning", Icon: AlertTriangle },
  danger: { box: "border-danger/30 bg-danger/10 text-danger", Icon: XCircle },
};

export function Alert({ variant = "info", title, children, className }: { variant?: AlertVariant; title?: string; children?: React.ReactNode; className?: string }) {
  const { box, Icon } = styles[variant];
  return (
    <div role={variant === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border px-4 py-3 text-sm", box, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 text-text-2">
        {title && <p className="font-semibold text-text">{title}</p>}
        {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
      </div>
    </div>
  );
}

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex items-center gap-2 text-sm text-text-3", className)}>
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-white/5", className)} aria-hidden />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card-surface p-5">
      <Skeleton className="mb-4 h-12 w-12 rounded-xl" />
      <Skeleton className="mb-2 h-5 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("mb-1.5 h-3.5", i === lines - 1 ? "w-1/2" : "w-full")} />
      ))}
    </div>
  );
}
