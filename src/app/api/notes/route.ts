import type { NextRequest } from "next/server";
import { json, withPublic } from "@/lib/auth/require-admin";
import { searchPublishedNotes } from "@/lib/queries/notes";
import { noteSearchInput } from "@/lib/validations/note";

export const dynamic = "force-dynamic";

/** Drop empty query values so `?type=&unit=` behaves like "not set". */
function cleanQuery(sp: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  sp.forEach((v, k) => {
    if (v.trim() !== "" && !(k in out)) out[k] = v;
  });
  return out;
}

/**
 * GET /api/notes — public search over published notes.
 * Query: `noteSearchInput` (q, programId, departmentId, semesterId, subjectId, unit, type, tag, since, sort, limit, cursor).
 * Response: PaginatedResult<NoteSummary>.
 */
export const GET = withPublic(async (req: NextRequest) => {
  const input = noteSearchInput.parse(cleanQuery(req.nextUrl.searchParams));
  const result = await searchPublishedNotes(input);
  return json(result, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
});
