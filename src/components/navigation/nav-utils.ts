import type { NAV_LINKS } from "@/constants/site";

export type NavLink = (typeof NAV_LINKS)[number];
export type NavChild = { label: string; href: string; description: string };

/** Path part of an href (drops query string and hash). */
export function pathOf(href: string): string {
  return href.split(/[?#]/)[0] || "/";
}

/** Routes that belong to the "Resources" area even though they are not under /resources. */
const RESOURCE_AREA_PREFIXES = ["/resources", "/programs", "/semesters", "/subjects", "/notes"];

function startsWithPath(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Whether a top-level nav entry should render in its active ("current page") style. */
export function isNavActive(pathname: string, href: string, children?: readonly NavChild[]): boolean {
  const base = pathOf(href);
  if (base === "/") return pathname === "/";
  if (startsWithPath(pathname, base)) return true;
  if (children) {
    const prefixes = new Set<string>(children.map((c) => pathOf(c.href)));
    if (base === "/resources") for (const p of RESOURCE_AREA_PREFIXES) prefixes.add(p);
    for (const p of prefixes) if (p !== "/" && startsWithPath(pathname, p)) return true;
  }
  return false;
}

export function hasChildren(link: NavLink): link is Extract<NavLink, { children: readonly NavChild[] }> {
  return "children" in link && Array.isArray(link.children) && link.children.length > 0;
}

/** Shared pill styling for top-level nav items. */
export function navPillClass(active: boolean): string {
  return [
    "inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors xl:px-4",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    active ? "bg-white/10 text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "text-text-2 hover:bg-white/5 hover:text-text",
  ].join(" ");
}
