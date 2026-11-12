/**
 * Logical file layout. PDFs are stored in Firestore (see blob-store.ts) under
 * these paths:
 *
 *   notes/drafts/{noteId}/{fileName}     — admin upload (chunked, via /api/admin/notes/upload), admin read
 *   notes/published/{noteId}/{fileName}  — server copies here on publish; streamed by /api/files/[noteId]
 *
 * Campus and faculty images are not uploaded: they ship as static files in
 * public/images (see constants/images.ts).
 */

export const STORAGE_PREFIX = {
  drafts: "notes/drafts",
  published: "notes/published",
} as const;

/** Strip path separators and unsafe characters from a user-supplied file name. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file.pdf";
  const cleaned = base.replace(/[^a-zA-Z0-9._ -]/g, "").replace(/\s+/g, " ").trim();
  const safe = cleaned.length ? cleaned : "document.pdf";
  return safe.toLowerCase().endsWith(".pdf") ? safe : `${safe}.pdf`;
}

const VERSION_PREFIX = /^v[0-9a-f]{8}_/;

/**
 * "notes.pdf" → "v1a2b3c4d_notes.pdf". Every copy/upload gets a unique object
 * name so concurrent operations never write to (or roll back) the same object.
 * Works in Node and the browser (Web Crypto).
 */
export function versionedFileName(fileName: string): string {
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  const tag = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `v${tag}_${sanitizeFileName(fileName).replace(VERSION_PREFIX, "")}`;
}

export function draftPath(noteId: string, fileName: string) {
  return `${STORAGE_PREFIX.drafts}/${noteId}/${sanitizeFileName(fileName)}`;
}

export function publishedPath(noteId: string, fileName: string) {
  return `${STORAGE_PREFIX.published}/${noteId}/${sanitizeFileName(fileName)}`;
}

export function isDraftPath(p: string) {
  return p.startsWith(`${STORAGE_PREFIX.drafts}/`);
}
export function isPublishedPath(p: string) {
  return p.startsWith(`${STORAGE_PREFIX.published}/`);
}

/** Parse `{noteId, fileName}` out of a notes/* path. */
export function parseNotePath(p: string): { noteId: string; fileName: string } | null {
  const m = p.match(/^notes\/(drafts|published)\/([^/]+)\/([^/]+)$/);
  if (!m) return null;
  return { noteId: m[2], fileName: m[3] };
}

/** Public URL for a published note (streamed from Firestore by our own API). */
export function publicFileUrl(noteId: string, opts?: { download?: boolean }) {
  return `/api/files/${encodeURIComponent(noteId)}${opts?.download ? "?download=1" : ""}`;
}

/** Admin-only preview URL for a draft (or any) note file. */
export function adminFileUrl(noteId: string, opts?: { download?: boolean }) {
  return `/api/admin/notes/${encodeURIComponent(noteId)}/file${opts?.download ? "?download=1" : ""}`;
}
