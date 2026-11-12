"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Bot, ChevronDown, LogIn } from "lucide-react";
import { NAV_LINKS, SITE } from "@/constants/site";
import { cn } from "@/lib/utils";
import { NavChildIcon } from "./nav-icons";
import { hasChildren, isNavActive } from "./nav-utils";

interface Props {
  id: string;
  open: boolean;
  pathname: string;
  onNavigate: () => void;
}

/** Slide-down panel under the sticky navbar (below the `lg` breakpoint). */
export function MobileMenu({ id, open, pathname, onNavigate }: Props) {
  // Sub-menu expansion is keyed to the pathname so it resets on navigation.
  const [expandedFor, setExpandedFor] = React.useState<string | null>(null);
  const resourcesActive = isNavActive(pathname, "/resources", NAV_LINKS[1].children);
  const expanded = expandedFor === pathname || (expandedFor === null && resourcesActive);

  return (
    <div
      id={id}
      className={cn(
        "absolute inset-x-0 top-full z-40 overflow-hidden border-b border-border bg-bg/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 ease-out lg:hidden",
        open ? "max-h-[calc(100dvh-4rem)] overflow-y-auto opacity-100" : "pointer-events-none max-h-0 opacity-0",
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <nav aria-label="Mobile" className="container-page py-4">
        <ul className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => {
            if (hasChildren(link)) {
              return (
                <li key={link.href}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-3 text-base font-medium transition-colors",
                      resourcesActive ? "bg-white/10 text-text" : "text-text-2 hover:bg-white/5 hover:text-text",
                    )}
                    aria-expanded={expanded}
                    aria-controls={`${id}-resources`}
                    onClick={() => setExpandedFor(expanded ? "" : pathname)}
                  >
                    {link.label}
                    <ChevronDown className={cn("h-5 w-5 transition-transform duration-200", expanded && "rotate-180")} aria-hidden />
                  </button>
                  <ul id={`${id}-resources`} hidden={!expanded} className="mt-1 grid gap-0.5 border-l border-border/70 pl-3 ml-3">
                    {link.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onNavigate}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-2 transition-colors hover:bg-white/5 hover:text-text"
                        >
                          <NavChildIcon href={child.href} className="h-4 w-4 shrink-0 text-lavender" aria-hidden />
                          <span className="min-w-0">
                            <span className="block font-medium text-text">{child.label}</span>
                            <span className="block text-xs text-text-3">{child.description}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }
            const active = isNavActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-3 text-base font-medium transition-colors",
                    active ? "bg-white/10 text-text" : "text-text-2 hover:bg-white/5 hover:text-text",
                  )}
                >
                  {link.label}
                  <ArrowRight className="h-4 w-4 text-muted" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          <Link
            href="/admin/login"
            title="Admin login"
            onClick={onNavigate}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/40 text-sm font-semibold text-lavender transition-colors hover:bg-primary/10"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Login
            <span className="text-xs font-normal text-muted">(admins)</span>
          </Link>
          <p className="inline-flex items-center justify-center gap-2 text-xs text-text-3">
            <Bot className="h-3.5 w-3.5 text-lavender" aria-hidden />
            {SITE.audience}
          </p>
        </div>
      </nav>
    </div>
  );
}
