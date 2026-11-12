import type { NextRequest } from "next/server";
import { HttpError, withPublic } from "@/lib/auth/require-admin";
import { getPublishedNote } from "@/lib/queries/notes";
import { blobReadStream, getBlobMeta, type ByteRange } from "@/lib/storage/blob-store";
import { isPublishedPath, sanitizeFileName } from "@/lib/storage/paths";
import { idSchema } from "@/lib/validations/common";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { noteId: string };

/** RFC 5987 `filename*` encoding (encodeURIComponent plus the characters it leaves alone). */
function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/** ASCII-only fallback for the plain `filename=` parameter. */
function asciiFileName(value: string): string {
  const ascii = value.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_").trim();
  return ascii || "document.pdf";
}

function contentDisposition(fileName: string, download: boolean): string {
  const kind = download ? "attachment" : "inline";
  return `${kind}; filename="${asciiFileName(fileName)}"; filename*=UTF-8''${encodeRfc5987(fileName)}`;
}

/**
 * Parse a single `bytes=` range. Returns `null` when no/unsupported header
 * (serve the whole file) and `"invalid"` when the range is unsatisfiable (416).
 */
function parseRange(header: string | null, size: number): ByteRange | null | "invalid" {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  // Multi-range or malformed → ignore and serve the full body (allowed by RFC 7233).
  if (!m) return null;
  const [, startRaw, endRaw] = m;
  if (startRaw === "" && endRaw === "") return null;

  let start: number;
  let end: number;
  if (startRaw === "") {
    // Suffix range: last N bytes.
    const suffix = Number(endRaw);
    if (suffix === 0) return "invalid";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(startRaw);
    end = endRaw === "" ? size - 1 : Math.min(Number(endRaw), size - 1);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= size || start > end) return "invalid";
  return { start, end };
}

async function serve(req: NextRequest, params: Params, method: "GET" | "HEAD"): Promise<Response> {
  const parsed = idSchema.safeParse(params.noteId);
  if (!parsed.success) throw new HttpError(404, "File not found.", "NOT_FOUND");

  const note = await getPublishedNote(parsed.data);
  // Only the published copy is ever served publicly — never a draft path.
  if (!note || !isPublishedPath(note.storagePath)) throw new HttpError(404, "File not found.", "NOT_FOUND");

  const meta = await getBlobMeta(note.storagePath);
  if (!meta) throw new HttpError(404, "File not found.", "NOT_FOUND");
  const size = meta.size;
  const etag = meta.etag;
  const lastModified = meta.updatedAt ? meta.updatedAt.toUTCString() : null;

  const download = req.nextUrl.searchParams.get("download") === "1";
  const fileName = sanitizeFileName(note.originalFileName || `${note.slug || note.id}.pdf`);

  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": contentDisposition(fileName, download),
    "Cache-Control": "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  });
  headers.set("ETag", etag);
  if (lastModified) headers.set("Last-Modified", lastModified);

  // Conditional GET — pdf.js and browsers revalidate with If-None-Match.
  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch.split(",").some((t) => t.trim() === etag)) {
    return new Response(null, { status: 304, headers });
  }

  const range = parseRange(req.headers.get("range"), size);
  if (range === "invalid") {
    headers.set("Content-Range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }

  let status = 200;
  if (range) {
    status = 206;
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
    headers.set("Content-Length", String(range.end - range.start + 1));
  } else {
    headers.set("Content-Length", String(size));
  }

  if (method === "HEAD") return new Response(null, { status, headers });

  return new Response(blobReadStream(meta, range ?? undefined), { status, headers });
}

/**
 * GET /api/files/[noteId] — stream the published PDF (inline, or as an
 * attachment with `?download=1`). Supports single-part Range requests so
 * pdf.js can fetch pages lazily (the viewer asks for chunk-aligned ranges, so
 * each request reads one Firestore chunk). 404 for drafts/unknown ids.
 */
export const GET = withPublic<Params>((req, { params }) => serve(req, params, "GET"));

/** HEAD /api/files/[noteId] — same headers, no body (pdf.js probes this). */
export const HEAD = withPublic<Params>((req, { params }) => serve(req, params, "HEAD"));
