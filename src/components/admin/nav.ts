import type { LucideIcon } from "lucide-react";
import { BookOpen, ExternalLink, FolderTree, LayoutDashboard, Megaphone, Settings, Upload, Users } from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match nested routes (e.g. /admin/notes/[id]). */
  exact?: boolean;
  external?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Notes", href: "/admin/notes", icon: BookOpen },
  { label: "Upload", href: "/admin/notes/new", icon: Upload, exact: true },
  { label: "Catalogue", href: "/admin/catalog", icon: FolderTree },
  { label: "Faculty", href: "/admin/faculty", icon: Users },
  { label: "Community", href: "/admin/community", icon: Megaphone },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export const ADMIN_SECONDARY_NAV: AdminNavItem[] = [{ label: "View site", href: "/", icon: ExternalLink, exact: true, external: true }];

export function isNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.exact) return pathname === item.href;
  // "Notes" should not light up for /admin/notes/new (that's "Upload").
  if (item.href === "/admin/notes" && pathname === "/admin/notes/new") return false;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
