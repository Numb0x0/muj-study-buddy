import { requireAdminPage } from "@/lib/auth/guard";
import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { safeLoad } from "@/components/admin/server/safe-load";
import { UploadNoteForm } from "@/components/admin/notes/UploadNoteForm";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { HARD_MAX_UPLOAD_MB, mbToBytes } from "@/constants/upload";
import { DEFAULT_SITE_SETTINGS, EMPTY_CATALOG, getCatalogTree, getSiteSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Upload" };

export default async function UploadPage() {
  await requireAdminPage();
  const [catalog, settings] = await Promise.all([safeLoad(() => getCatalogTree(), EMPTY_CATALOG), safeLoad(() => getSiteSettings(), DEFAULT_SITE_SETTINGS)]);
  const maxMb = Math.min(settings.data.maxUploadMb, HARD_MAX_UPLOAD_MB);
  return (
    <>
      <AdminPageHeader
        title="Upload a resource"
        description="Upload a PDF, describe it, then save it as a draft or publish straight away."
        actions={
          <Button href="/admin/notes" variant="ghost">
            All notes
          </Button>
        }
      />
      {catalog.error && <Alert variant="danger" className="mb-6">{catalog.error}</Alert>}
      <UploadNoteForm catalog={catalog.data} maxUploadBytes={mbToBytes(maxMb)} defaultProgramId={settings.data.defaultProgramId} />
    </>
  );
}
