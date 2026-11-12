import { json, withAdmin } from "@/lib/auth/require-admin";
import { listNotesAdmin } from "@/lib/queries/notes";
import { createDraft } from "@/lib/services/notes";
import { adminNoteListInput, createNoteInput } from "@/lib/validations/note";

export const dynamic = "force-dynamic";

function cleanQuery(sp: URLSearchParams) {
  const out: Record<string, string> = {};
  sp.forEach((v, k) => {
    if (v.trim() !== "" && !(k in out)) out[k] = v;
  });
  return out;
}

export const GET = withAdmin(async (req) => {
  const input = adminNoteListInput.parse(cleanQuery(req.nextUrl.searchParams));
  return json(await listNotesAdmin(input), { headers: { "Cache-Control": "no-store" } });
});

export const POST = withAdmin(async (req, { session }) => {
  const input = createNoteInput.parse(await req.json());
  return json(await createDraft(session, input), { status: 201 });
});
