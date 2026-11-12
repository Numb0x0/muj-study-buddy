"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavChildIcon } from "./nav-icons";
import { navPillClass, type NavChild } from "./nav-utils";

interface Props {
  label: string;
  href: string;
  items: readonly NavChild[];
  active: boolean;
}

const CLOSE_DELAY_MS = 140;

/**
 * Desktop "Resources" menu. Opens on mouse hover, toggles on click/tap,
 * supports Arrow/Home/End/Escape keys, closes on outside click, blur and
 * route change (state is keyed to the current pathname, so navigating resets it).
 */
export function ResourcesDropdown({ label, href, items, active }: Props) {
  const pathname = usePathname();
  const menuId = React.useId();
  const [openPath, setOpenPath] = React.useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = React.useCallback((next: boolean) => setOpenPath(next ? pathname : null), [pathname]);

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const itemRefs = React.useRef<Array<HTMLAnchorElement | null>>([]);
  const closeTimer = React.useRef<number | null>(null);
  /** Set when hover opened the menu, so the follow-up mouse click doesn't close it. */
  const openedByHover = React.useRef(false);

  const clearTimer = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  // Outside click / tap closes the menu.
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, setOpen]);

  React.useEffect(() => clearTimer, []);

  const focusItem = (index: number) => {
    const list = itemRefs.current.filter(Boolean) as HTMLAnchorElement[];
    if (!list.length) return;
    const i = ((index % list.length) + list.length) % list.length;
    list[i].focus();
  };

  const openAndFocus = (index: number) => {
    setOpen(true);
    // Items are rendered (hidden) already, so they can take focus on the next frame.
    window.requestAnimationFrame(() => focusItem(index));
  };

  const onButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case "ArrowDown":
      case "Enter":
      case " ":
        e.preventDefault();
        openAndFocus(0);
        break;
      case "ArrowUp":
        e.preventDefault();
        openAndFocus(-1);
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
    }
  };

  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const list = itemRefs.current.filter(Boolean) as HTMLAnchorElement[];
    const current = list.indexOf(document.activeElement as HTMLAnchorElement);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusItem(current + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusItem(current - 1);
        break;
      case "Home":
        e.preventDefault();
        focusItem(0);
        break;
      case "End":
        e.preventDefault();
        focusItem(-1);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case "Tab":
        // Let focus move on naturally, but don't leave the menu hanging open.
        setOpen(false);
        break;
    }
  };

  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
  };

  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimer();
    if (!open) openedByHover.current = true;
    setOpen(true);
  };
  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  let refIndex = 0;

  return (
    <div ref={wrapRef} className="relative" onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} onBlur={onBlur}>
      <button
        ref={buttonRef}
        type="button"
        className={navPillClass(active || open)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={(e) => {
          // Mouse click after hover-open keeps it open; keyboard/touch toggles.
          const isMouse = e.detail > 0 && (e.nativeEvent as PointerEvent).pointerType === "mouse";
          if (isMouse && openedByHover.current) {
            openedByHover.current = false;
            setOpen(true);
            return;
          }
          openedByHover.current = false;
          setOpen(!open);
        }}
        onKeyDown={onButtonKeyDown}
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")} aria-hidden />
      </button>

      <div
        id={menuId}
        role="menu"
        aria-label={label}
        hidden={!open}
        onKeyDown={onMenuKeyDown}
        className={cn(
          "absolute left-1/2 top-full z-50 mt-2 w-[22rem] -translate-x-1/2 rounded-2xl border border-border bg-bg-2/95 p-2 shadow-card backdrop-blur-xl",
          // Invisible bridge so the pointer can cross the gap without closing.
          "before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-['']",
          open && "animate-fade-up",
        )}
      >
        <ul className="grid gap-0.5">
          {items.map((item) => {
            const i = refIndex++;
            return (
              <li key={item.href} role="none">
                <Link
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  role="menuitem"
                  tabIndex={open ? 0 : -1}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none"
                >
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-lavender">
                    <NavChildIcon href={item.href} className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-text">{item.label}</span>
                    <span className="block text-xs text-text-3">{item.description}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-1 border-t border-border pt-1.5">
          <Link
            ref={(el) => {
              itemRefs.current[refIndex] = el;
            }}
            role="menuitem"
            tabIndex={open ? 0 : -1}
            href={href}
            onClick={() => setOpen(false)}
            className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-lavender transition-colors hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none"
          >
            Browse all resources
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
