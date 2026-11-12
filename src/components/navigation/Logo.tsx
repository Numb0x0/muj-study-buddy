import Link from "next/link";
import { Bot, GraduationCap } from "lucide-react";
import { SITE } from "@/constants/site";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Show the "For MUJ Robotics Students" audience tag next to the wordmark. */
  showAudience?: boolean;
  className?: string;
}

/** Brand lockup: cap icon + gradient wordmark (+ optional audience tag). Server-safe. */
export function Logo({ showAudience = true, className }: LogoProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Link
        href="/"
        className="group inline-flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        aria-label={`${SITE.name} — home`}
      >
        <GraduationCap className="h-8 w-8 text-primary drop-shadow-[0_0_12px_rgba(168,85,247,0.55)] transition-transform duration-300 group-hover:-rotate-6" aria-hidden />
        <span className="whitespace-nowrap text-lg font-bold tracking-tight sm:text-xl">
          <span className="text-text">MUJ </span>
          <span className="text-gradient">Study Buddy</span>
        </span>
      </Link>
      {showAudience && (
        <>
          <span className="hidden h-6 w-px shrink-0 bg-border-2 xl:block" aria-hidden />
          <span className="hidden min-w-0 items-center gap-2 truncate text-sm text-text-2 xl:inline-flex">
            <Bot className="h-4 w-4 shrink-0 text-lavender" aria-hidden />
            <span className="truncate">{SITE.audience}</span>
          </span>
        </>
      )}
    </div>
  );
}
