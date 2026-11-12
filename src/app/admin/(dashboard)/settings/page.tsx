import { requireAdminPage } from "@/lib/auth/guard";
import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SettingsForm } from "@/components/admin/settings/SettingsForm";
import { safeLoad } from "@/components/admin/server/safe-load";
import { Alert } from "@/components/ui/Feedback";
import { DEFAULT_SITE_SETTINGS, getPrograms, getSiteSettings } from "@/lib/queries";
import { getStoredBytes } from "@/lib/storage/blob-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdminPage();
  const [settings, programs, storedBytes] = await Promise.all([
    safeLoad(() => getSiteSettings(), DEFAULT_SITE_SETTINGS),
    safeLoad(() => getPrograms(undefined, { includeInactive: true }), []),
    safeLoad(() => getStoredBytes(), null),
  ]);
  return (
    <>
      <AdminPageHeader title="Website settings" description="Site-wide text, contact details, upload limits and homepage image." />
      {settings.error && <Alert variant="danger" className="mb-6">{settings.error}</Alert>}
      <SettingsForm settings={settings.data} programs={programs.data} storedBytes={storedBytes.data} />
    </>
  );
}
