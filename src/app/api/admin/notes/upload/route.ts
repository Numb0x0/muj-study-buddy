import { HttpError, json, withAdmin } from "@/lib/auth/require-admin";
import { uploadChunk } from "@/lib/services/notes";
import { uploadChunkQuery } from "@/lib/validations/note";
import { UPLOAD_CHUNK_BYTES } from "@/constants/upload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PUT /api/admin/notes/upload?path=notes/drafts/{noteId}/{file}&index=N&size=BYTES
 *
 * Body: raw bytes of chunk N (application/octet-stream). The browser uploads a
 * PDF as ⌈size / UPLOAD_CHUNK_BYTES⌉ sequential chunks, then calls
 * POST /api/admin/notes (or …/replace-file), which verifies the whole file.
 */
export const PUT = withAdmin(async (req) => {
  const query = uploadChunkQuery.parse(Object.fromEntries(req.nextUrl.searchParams));
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > UPLOAD_CHUNK_BYTES) throw new HttpError(413, "Chunk is too large.", "TOO_LARGE");
  const data = Buffer.from(await req.arrayBuffer());
  if (data.length > UPLOAD_CHUNK_BYTES) throw new HttpError(413, "Chunk is too large.", "TOO_LARGE");
  return json(await uploadChunk(query, data));
});
