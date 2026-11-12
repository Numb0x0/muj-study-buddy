"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { GraduationCap, LogOut, Menu, X } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { AdminSession } from "@/types/auth";
import { ADMIN_NAV, ADMIN_SECONDARY_NAV, isNavActive } from "./nav";
import { ToastProvider } from "./Toast";

export function AdminShell({ session, children }: { session: AdminSession; children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ShellInner session={session}>{children}</ShellInner>
    </ToastProvider>
  );
}

function ShellInner({ session, children }: { session: AdminSession; children: React.ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const [openOn, setOpenOn] = React.useState<string | null>(null);
  const open = openOn === pathname;
  const auth = useAdminAuth({ initialUser: session });
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const closeMenu = React.useCallback(() => setOpenOn(null), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const menuButton = menuButtonRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      menuButton?.focus(); // return focus to the hamburger
    };
  }, [open]);

  const user = auth.user ?? session;

  const nav = (
    <nav aria-label="Admin" className="flex h-full flex-col gap-1 p-3">
      <Link href="/admin" className="mb-4 flex items-center gap-2 px-3 py-2">
        <GraduationCap className="h-7 w-7 text-primary" aria-hidden />
        <span className="font-bold">
          <span className="text-text">MUJ </span>
          <span className="text-gradient">Study Buddy</span>
        </span>
      </Link>
      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Manage</p>
      {ADMIN_NAV.map((item) => {
        const active = isNavActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMenu}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary/15 text-lavender shadow-[inset_0_0_0_1px_rgba(168,85,247,0.3)]" : "text-text-2 hover:bg-white/5 hover:text-text",
            )}
          >
            <item.icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto border-t border-border pt-3">
        {ADMIN_SECONDARY_NAV.map((item) => (
          <Link key={item.href} href={item.href} target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-3 hover:bg-white/5 hover:text-text">
            <item.icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[16rem_1fr]">
      <div className="hidden border-r border-border bg-bg-2 lg:block">
        <aside className="sticky top-0 h-dvh">{nav}</aside>
      </div>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "" : "pointer-events-none")} aria-hidden={!open} inert={!open}>
        <div className={cn("absolute inset-0 bg-bg/70 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpenOn(null)} />
        <aside role="dialog" aria-modal="true" aria-label="Admin navigation" className={cn("absolute inset-y-0 left-0 w-72 border-r border-border bg-bg-2 transition-transform", open ? "translate-x-0" : "-translate-x-full")}>
          <button ref={closeButtonRef} type="button" onClick={closeMenu} className="absolute right-3 top-3 rounded-lg p-2 text-text-3 hover:bg-white/5" aria-label="Close menu">
            <X className="h-5 w-5" aria-hidden />
          </button>
          {nav}
        </aside>
      </div>

      {/* Inert while the mobile drawer is open, so Tab can't wander behind the overlay. */}
      <div className="flex min-w-0 flex-col" inert={open}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
          <button ref={menuButtonRef} type="button" onClick={() => setOpenOn(pathname)} className="rounded-xl border border-border p-2 text-text-2 lg:hidden" aria-label="Open menu" aria-expanded={open}>
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <p className="hidden text-sm text-text-3 sm:block">Administrator dashboard</p>
          <div className="flex min-w-0 items-center gap-3">
            {user.picture ? (
              <Image src={user.picture} alt="" width={32} height={32} className="h-8 w-8 rounded-full border border-border" unoptimized />
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-lavender">{(user.name ?? user.email ?? "A").charAt(0).toUpperCase()}</span>
            )}
            <div className="hidden min-w-0 text-right md:block">
              <p className="truncate text-sm font-medium text-text">{user.name ?? "Administrator"}</p>
              <p className="truncate text-xs text-text-3">{user.email}</p>
            </div>
            <Button variant="ghost" size="sm" aria-label="Sign out" onClick={() => void auth.signOut()} leftIcon={<LogOut className="h-4 w-4" aria-hidden />}>
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
