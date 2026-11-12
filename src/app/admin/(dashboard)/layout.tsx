import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdminConfigured } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

/**
 * Server-side guard for every dashboard page: verifies the session cookie with
 * the Admin SDK (signature, revocation, admin claim). The proxy only checks the
 * cookie exists; this is the real check. API routes verify independently.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminConfigured()) redirect("/admin/login?error=not-configured");
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return <AdminShell session={session}>{children}</AdminShell>;
}
