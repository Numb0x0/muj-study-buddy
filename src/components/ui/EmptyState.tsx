import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, className, compact }: Props) {
  return (
    <div className={cn("card-surface flex flex-col items-center justify-center text-center", compact ? "px-4 py-8" : "px-6 py-14", className)}>
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-bg-2 text-text-3">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden />}
      </div>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-text-3">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
