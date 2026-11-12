import { HttpError, withAdmin } from "@/lib/auth/require-admin";
import { getNoteRaw } from "@/lib/queries/notes";
import { streamNoteFile } from "@/lib/services/notes";
import { idSchema } from "@/lib/validations/common";

export const dynamic = "force-dynamic";
type P = { id: string };

async function load(id: string) {
  const note = await getNoteRaw(idSchema.parse(id));
  if (!note) throw new HttpError(404, "Note not found.", "NOT_FOUND");
  return note;
}

/** Admin preview of a note's current file, whatever its status. */
export const GET = withAdmin<P>(async (req, { params }) => streamNoteFile(await load(params.id), { download: req.nextUrl.searchParams.get("download") === "1" }));
export const HEAD = withAdmin<P>(async (_req, { params }) => streamNoteFile(await load(params.id), { head: true }));
