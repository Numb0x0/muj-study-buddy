"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/constants/site";
import { Button } from "@/components/ui/Button";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { ResourcesDropdown } from "./ResourcesDropdown";
import { hasChildren, isNavActive, navPillClass } from "./nav-utils";

const MOBILE_MENU_ID = "mobile-menu";

/** Sticky, translucent site header with desktop links and a mobile slide-down menu. */
export function Navbar() {
  const pathname = usePathname() ?? "/";
  // The open flag is tied to the pathname it was opened on, so a route change closes the menu
  // without needing a state-setting effect.
  const [openOn, setOpenOn] = React.useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = React.useCallback((next: boolean) => setOpenOn(next ? pathname : null), [pathname]);

  // Body scroll lock + Escape while the mobile panel is open; close if the viewport grows to desktop.
  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
    };
  }, [open, setOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/65">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) =>
            hasChildren(link) ? (
              <ResourcesDropdown key={link.href} label={link.label} href={link.href} items={link.children} active={isNavActive(pathname, link.href, link.children)} />
            ) : (
              <Link key={link.href} href={link.href} className={navPillClass(isNavActive(pathname, link.href))} aria-current={isNavActive(pathname, link.href) ? "page" : undefined}>
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            href="/admin/login"
            variant="outline"
            size="sm"
            title="Admin login"
            leftIcon={<LogIn className="h-4 w-4" aria-hidden />}
            className="hidden border-primary/40 text-lavender hover:bg-primary/10 sm:inline-flex"
          >
            Login
          </Button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-2 transition-colors hover:border-primary/50 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={MOBILE_MENU_ID}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      <MobileMenu id={MOBILE_MENU_ID} open={open} pathname={pathname} onNavigate={() => setOpen(false)} />
    </header>
  );
}
