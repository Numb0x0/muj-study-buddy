import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (clsx + tailwind-merge). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** URL-safe slug from any string. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/** All dates render in IST on both server and browser, so hosting in UTC can't cause hydration mismatches. */
export const APP_TIME_ZONE = "Asia/Kolkata";

export function formatDate(input: Date | string | number | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!input) return "—";
  const d = typeof input === "string" || typeof input === "number" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: APP_TIME_ZONE, ...opts }).format(d);
}

/** "Unit 2 · Kinematics", or just "Unit 2" when the title only repeats the number. */
export function unitLabel(unitNumber: number | null, unitTitle: string | null): string | null {
  if (!unitNumber) return null;
  const t = unitTitle?.trim();
  return t && t.toLowerCase() !== `unit ${unitNumber}` ? `Unit ${unitNumber} · ${t}` : `Unit ${unitNumber}`;
}

export function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Build a query string, skipping empty values. */
export function toQueryString(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
