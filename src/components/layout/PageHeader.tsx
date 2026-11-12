import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-text-3", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-text" aria-label="Home">
            <Home className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </li>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-muted" aria-hidden />
              {c.href && !last ? (
                <Link href={c.href} className="transition-colors hover:text-text">
                  {c.label}
                </Link>
              ) : (
                <span className={cn(last && "text-text-2")} aria-current={last ? "page" : undefined}>
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
  /** Extra content under the description (badges, meta). */
  children?: React.ReactNode;
  className?: string;
}

/** Consistent hero header for every inner public page. */
export function PageHeader({ title, description, eyebrow, crumbs, actions, children, className }: PageHeaderProps) {
  return (
    <header className={cn("relative overflow-hidden border-b border-border bg-bg-2/60", className)}>
      <div className="glow-blob absolute -top-24 right-[-10%] h-72 w-[40rem] opacity-70" aria-hidden />
      <div className="absolute inset-0 bg-grid opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <Container className="relative py-10 sm:py-14">
        {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} className="mb-5" />}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            {eyebrow && <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-lavender">{eyebrow}</div>}
            <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">{title}</h1>
            {description && <p className="mt-3 max-w-2xl text-base text-text-3 sm:text-lg">{description}</p>}
            {children && <div className="mt-4">{children}</div>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
        </div>
      </Container>
    </header>
  );
}
