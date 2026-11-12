import { requireAdminPage } from "@/lib/auth/guard";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { NoteDetail } from "@/components/admin/notes/NoteDetail";
import { safeLoad } from "@/components/admin/server/safe-load";
import { Button } from "@/components/ui/Button";
import { HARD_MAX_UPLOAD_MB, mbToBytes } from "@/constants/upload";
import { DEFAULT_SITE_SETTINGS, EMPTY_CATALOG, getCatalogTree, getNoteAdmin, getSiteSettings, listAuditLogs } from "@/lib/queries";
import { findDuplicates } from "@/lib/services/notes";
import { adminAuth } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit note" };

export default async function NoteDetailPage(props: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await props.params;
  const note = await getNoteAdmin(id).catch(() => null);
  if (!note) notFound();
  const [catalog, duplicates, audit, settings, uploader] = await Promise.all([
    safeLoad(() => getCatalogTree({ includeInactive: true }), EMPTY_CATALOG),
    safeLoad(() => findDuplicates({ id: note.id, contentHash: note.contentHash, subjectId: note.subjectId, titleLower: note.titleLower }), []),
    safeLoad(() => listAuditLogs({ targetId: id, limit: 20 }), []),
    safeLoad(() => getSiteSettings(), DEFAULT_SITE_SETTINGS),
    adminAuth()
      .getUser(note.uploadedBy)
      .then((u) => u.email ?? null)
      .catch(() => null),
  ]);
  return (
    <>
      <AdminPageHeader
        title={note.title}
        description={`${note.subjectCode} · ${note.subjectName} · Semester ${note.semesterNumber}`}
        actions={
          <Button href="/admin/notes" variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
            All notes
          </Button>
        }
      />
      <NoteDetail note={note} catalog={catalog.data} duplicates={duplicates.data} audit={audit.data} maxUploadBytes={mbToBytes(Math.min(settings.data.maxUploadMb, HARD_MAX_UPLOAD_MB))} uploaderEmail={uploader} />
    </>
  );
}
