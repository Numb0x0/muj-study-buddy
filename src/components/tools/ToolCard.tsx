import * as React from "react";
import { Card, CardIcon } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  /** Rendered on the right of the heading (badges, reset buttons). */
  headerAction?: React.ReactNode;
}

/** Shared shell for every tool so the page reads as one system. */
export function ToolCard({ id, icon, title, description, children, className, headerAction }: Props) {
  const titleId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={titleId} className={cn("scroll-mt-24", className)}>
      <Card padding="lg" className="h-full">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <CardIcon>{icon}</CardIcon>
            <div className="min-w-0">
              <h2 id={titleId} className="text-xl font-bold tracking-tight text-text">
                {title}
              </h2>
              <p className="mt-1 text-sm text-text-3">{description}</p>
            </div>
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </header>
        <div className="mt-6">{children}</div>
      </Card>
    </section>
  );
}

/** Small monospace "how it's computed" block used by the calculators. */
export function FormulaNote({ title = "How it's computed", lines }: { title?: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-bg-2/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-3">{title}</p>
      <ul className="mt-2 space-y-1 font-mono text-xs leading-relaxed text-text-2 sm:text-[13px]">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

/** Highlighted result tile. */
export function StatTile({ label, value, hint, tone = "primary" }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "primary" | "success" | "warning" | "danger" | "muted" }) {
  const tones = {
    primary: "border-primary/40 bg-primary/10 text-lavender-2",
    success: "border-success/40 bg-success/10 text-success",
    warning: "border-warning/40 bg-warning/10 text-warning",
    danger: "border-danger/40 bg-danger/10 text-danger",
    muted: "border-border bg-bg-2/70 text-text",
  } as const;
  return (
    <div className={cn("rounded-xl border p-4", tones[tone])}>
      <p className="text-xs font-medium uppercase tracking-wider text-text-3">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-text-3">{hint}</p>}
    </div>
  );
}
