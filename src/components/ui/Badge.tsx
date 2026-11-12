import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info" | "outline";

const variants: Record<BadgeVariant, string> = {
  default: "bg-white/5 text-text-2 border-border",
  primary: "bg-primary/15 text-lavender border-primary/30",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  info: "bg-info/15 text-info border-info/30",
  outline: "bg-transparent text-text-2 border-border-2",
};

export function Badge({ variant = "default", className, ...rest }: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5", variants[variant], className)}
      {...rest}
    />
  );
}
