import { HttpError, json, withAdmin } from "@/lib/auth/require-admin";
import { listAuditLogs } from "@/lib/queries/audit";
import { getNoteAdmin } from "@/lib/queries/notes";
import { deleteNote, findDuplicates, updateNote } from "@/lib/services/notes";
import { updateNoteInput } from "@/lib/validations/note";
import { idSchema } from "@/lib/validations/common";

export const dynamic = "force-dynamic";
type P = { id: string };

export const GET = withAdmin<P>(async (_req, { params }) => {
  const id = idSchema.parse(params.id);
  const note = await getNoteAdmin(id);
  if (!note) throw new HttpError(404, "Note not found.", "NOT_FOUND");
  const [duplicates, audit] = await Promise.all([
    findDuplicates({ id: note.id, contentHash: note.contentHash, subjectId: note.subjectId, titleLower: note.titleLower }),
    listAuditLogs({ targetId: id, limit: 20 }),
  ]);
  return json({ note, duplicates, audit });
});

export const PATCH = withAdmin<P>(async (req, { params, session }) => {
  const note = await updateNote(session, idSchema.parse(params.id), updateNoteInput.parse(await req.json()));
  return json({ note });
});

export const DELETE = withAdmin<P>(async (_req, { params, session }) => {
  await deleteNote(session, idSchema.parse(params.id));
  return json({ ok: true });
});
