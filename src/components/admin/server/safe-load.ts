import "server-only";
import { tryQuery } from "@/lib/queries/safe";
import { requireAdminPage } from "@/lib/auth/guard";

export interface Loaded<T> {
  data: T;
  /** Non-config error message (e.g. missing Firestore index) — surfaced as an Alert instead of crashing the page. */
  error: string | null;
}

/**
 * tryQuery() already swallows "Firebase not configured" errors. Admin pages
 * additionally catch everything else and render an Alert so one broken query
 * never takes the whole dashboard down.
 */
export async function safeLoad<T>(fn: () => Promise<T>, fallback: T): Promise<Loaded<T>> {
  // Never load admin data without a verified admin session (see lib/auth/guard.ts).
  await requireAdminPage();
  try {
    return { data: await tryQuery(fn, fallback), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (process.env.NODE_ENV !== "production") console.error("[admin] query failed:", message);
    return { data: fallback, error: message.split("\n")[0] };
  }
}
