import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { AdminSession } from "@/types/auth";
import { getAdminSession } from "./session";

/**
 * Per-page admin guard. Layouts render in parallel with their pages, so a
 * redirect() in the dashboard layout does NOT stop a page's data from being
 * serialised into the response. Every admin page (and safeLoad) awaits this
 * before touching Firestore. Cached per request, so the cookie is verified once.
 */
export const requireAdminPage = cache(async (): Promise<AdminSession> => {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
});
