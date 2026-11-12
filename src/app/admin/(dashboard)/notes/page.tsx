import { requireAdminPage } from "@/lib/auth/guard";
import type { Metadata } from "next";
import { Upload } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { safeLoad } from "@/components/admin/server/safe-load";
import { NotesManager, type NotesFilter } from "@/components/admin/notes/NotesManager";
import { Button } from "@/components/ui/Button";
import { EMPTY_CATALOG, getCatalogTree, listNotesAdmin } from "@/lib/queries";
import { adminNoteListInput } from "@/lib/validations/note";
import type { Note, PaginatedResult } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notes" };

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const EMPTY: PaginatedResult<Note> = { items: [], nextCursor: null, hasMore: false };

export default async function NotesPage(props: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await props.searchParams;
  const status = first(sp.status);
  const filter: NotesFilter = {
    status: status === "draft" || status === "published" || status === "archived" ? status : "all",
    q: first(sp.q),
    programId: first(sp.programId),
    semesterId: first(sp.semesterId),
    subjectId: first(sp.subjectId),
    type: first(sp.type),
  };
  const parsed = adminNoteListInput.safeParse({ ...Object.fromEntries(Object.entries(filter).filter(([, v]) => v !== "")), limit: 20 });
  const [catalog, notes] = await Promise.all([
    safeLoad(() => getCatalogTree({ includeInactive: true }), EMPTY_CATALOG),
    parsed.success ? safeLoad(() => listNotesAdmin(parsed.data), EMPTY) : Promise.resolve({ data: EMPTY, error: "Invalid filters." }),
  ]);
  const title = filter.status === "draft" ? "Drafts" : filter.status === "published" ? "Published resources" : filter.status === "archived" ? "Archived" : "Notes";

  return (
    <>
      <AdminPageHeader
        title={title}
        description="Preview, publish, unpublish, archive and delete uploaded resources."
        actions={
          <Button href="/admin/notes/new" leftIcon={<Upload className="h-4 w-4" aria-hidden />}>
            Upload PDF
          </Button>
        }
      />
      <NotesManager key={JSON.stringify(filter)} catalog={catalog.data} filter={filter} initial={notes.data} initialError={notes.error ?? catalog.error} />
    </>
  );
}
