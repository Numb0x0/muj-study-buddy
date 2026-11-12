import type { AuditAction, AuditLog } from "@/types";
import { APP_TIME_ZONE } from "@/lib/utils";

/** "3 min ago", "yesterday", "12 Mar 2026" — short relative time for admin lists. */
export function relativeTime(input: string | null | undefined, now: number = Date.now()): string {
  if (!input) return "—";
  const t = new Date(input).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Math.round((t - now) / 1000);
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 45) return "just now";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 7 * 86_400) return rtf.format(Math.round(diff / 86_400), "day");
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: APP_TIME_ZONE }).format(t);
}

export function formatDateTime(input: string | null | undefined): string {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: APP_TIME_ZONE }).format(d);
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "note.create": "Created draft",
  "note.update": "Edited note",
  "note.replaceFile": "Replaced file",
  "note.publish": "Published note",
  "note.unpublish": "Unpublished note",
  "note.archive": "Archived note",
  "note.delete": "Deleted note",
  "catalog.create": "Added catalogue entry",
  "catalog.update": "Edited catalogue entry",
  "catalog.delete": "Removed catalogue entry",
  "faculty.create": "Added faculty",
  "faculty.update": "Edited faculty",
  "faculty.delete": "Removed faculty",
  "community.create": "Added community item",
  "community.update": "Edited community item",
  "community.delete": "Removed community item",
  "settings.update": "Updated settings",
  "auth.login": "Signed in",
  "auth.logout": "Signed out",
};

export function auditLabel(action: string): string {
  return (AUDIT_ACTION_LABELS as Record<string, string>)[action] ?? action.replace(/[._]/g, " ");
}

/** Best-effort human target for an audit row (title from metadata if the API stored one). */
export function auditTarget(log: AuditLog): string | null {
  const meta = log.metadata ?? {};
  const candidates = ["title", "name", "status", "kind"];
  for (const k of candidates) {
    const v = meta[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

/** Link to the thing an audit row refers to, when the admin UI has a page for it. */
export function auditHref(log: AuditLog): string | null {
  if (log.targetCollection === "notes" && log.action !== "note.delete") return `/admin/notes/${encodeURIComponent(log.targetId)}`;
  if (log.targetCollection === "faculty") return "/admin/faculty";
  if (["universities", "departments", "programs", "semesters", "subjects"].includes(log.targetCollection)) return "/admin/catalog";
  if (log.targetCollection === "communityItems" || log.targetCollection === "announcements") return "/admin/community";
  if (log.targetCollection === "siteSettings") return "/admin/settings";
  return null;
}

/** "my file_name-v2.pdf" → "My File Name V2" */
export function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!base) return "";
  return base
    .split(" ")
    .map((w) => (w.length <= 3 && w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}
