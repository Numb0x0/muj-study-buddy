import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: { label: string; href: string };
  as?: "h1" | "h2" | "h3";
  className?: string;
  align?: "left" | "center";
}

export function SectionHeading({ title, subtitle, icon, action, as: Tag = "h2", className, align = "left" }: Props) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8", align === "center" && "flex-col items-center text-center", className)}>
      <div className={cn("flex items-start gap-3", align === "center" && "flex-col items-center")}>
        {icon && <span className="mt-1 text-primary">{icon}</span>}
        <div>
          <Tag className={cn("font-bold tracking-tight text-text", Tag === "h1" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl")}>{title}</Tag>
          {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-text-3 sm:text-base">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <Link href={action.href} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-lavender transition-colors hover:text-primary">
          {action.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
