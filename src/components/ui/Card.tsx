import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds lift + glow on hover (use for clickable cards). */
  interactive?: boolean;
  /** Adds a soft glowing border, used for the Faculty section frame. */
  glow?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddings = { none: "", sm: "p-4", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" };

export function Card({ interactive, glow, padding = "md", className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "card-surface",
        paddings[padding],
        interactive && "card-hover",
        glow && "border-primary/50 shadow-glow",
        className,
      )}
      {...rest}
    />
  );
}

export function CardIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-lavender shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
