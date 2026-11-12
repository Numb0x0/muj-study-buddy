import type { NextRequest } from "next/server";
import { HttpError, json, withPublic } from "@/lib/auth/require-admin";
import { getPublishedNote, getRelatedNotes, toPublicNote } from "@/lib/queries/notes";
import { idSchema } from "@/lib/validations/common";

export const dynamic = "force-dynamic";

type Params = { noteId: string };

/**
 * GET /api/notes/[noteId] — a single published note plus related resources
 * from the same subject. 404 for drafts, archived or unknown ids.
 */
export const GET = withPublic<Params>(async (_req: NextRequest, { params }) => {
  const parsed = idSchema.safeParse(params.noteId);
  if (!parsed.success) throw new HttpError(404, "Resource not found.", "NOT_FOUND");

  const note = await getPublishedNote(parsed.data);
  if (!note) throw new HttpError(404, "Resource not found.", "NOT_FOUND");

  const related = await getRelatedNotes(note).catch(() => []);
  return json(
    { note: toPublicNote(note), related },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
});
