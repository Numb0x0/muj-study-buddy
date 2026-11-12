import "server-only";

/**
 * Note lifecycle (server only):
 *
 *   prepareUpload → uploadChunk × N (browser → notes/drafts/{id}/…) → createDraft
 *   → publishNote (copy drafts → published, verify, flip status, delete draft copy)
 *   ↔ unpublishNote / archiveNote (copy back to drafts)
 *   replaceFile, updateNote, deleteNote
 *
 * File bytes live in Firestore (lib/storage/blob-store.ts) because the Spark
 * plan has no Cloud Storage. Every step re-verifies the stored file instead of
 * trusting the client, and any failure after a copy rolls the copy back so the
 * note document and the stored file never disagree.
 */
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/constants/collections";
import { ALLOWED_MIME_TYPES, HARD_MAX_UPLOAD_MB, mbToBytes, UPLOAD_CHUNK_BYTES } from "@/constants/upload";
import { HttpError } from "@/lib/auth/require-admin";
import { docToData, docToRaw } from "@/lib/firebase/serialize";
import { getSiteSettings } from "@/lib/queries/settings";
import { findNotesByHash, findNotesByTitle, getNoteRaw } from "@/lib/queries/notes";
import { writeAuditLog } from "@/lib/queries/audit";
import { computeSearchTokens } from "@/lib/note-tokens";
import { draftPath, isDraftPath, parseNotePath, publishedPath, versionedFileName } from "@/lib/storage/paths";
import { blobReadStream, copyBlob, deleteBlob, deleteBlobsForNote, getBlobMeta, isBlobComplete, readBlobHead, writeBlobChunk } from "@/lib/storage/blob-store";
import { slugify } from "@/lib/utils";
import type { CreateNoteInput, UpdateNoteInput, UploadChunkQuery, UploadedFileInput } from "@/lib/validations/note";
import type { AdminSession, DepartmentDoc, Note, NoteDoc, NoteSummary, ProgramDoc, SemesterDoc, SubjectDoc } from "@/types";
import { revalidatePublic } from "./revalidate";

const notesCol = () => adminDb().collection(COLLECTIONS.notes);

// ── Helpers ─────────────────────────────────────────────────────

async function maxUploadBytes(): Promise<number> {
  const settings = await getSiteSettings().catch(() => null);
  const mb = Math.min(settings?.maxUploadMb ?? HARD_MAX_UPLOAD_MB, HARD_MAX_UPLOAD_MB);
  return mbToBytes(mb);
}

async function safeDelete(path: string) {
  try {
    await deleteBlob(path);
  } catch (err) {
    console.error("[notes] failed to delete", path, err);
  }
}

/** Verify an uploaded draft file exists, is complete and matches what the client claims. */
async function verifyUploadedFile(file: UploadedFileInput, noteId: string): Promise<void> {
  const parsed = parseNotePath(file.storagePath);
  if (!parsed || !isDraftPath(file.storagePath) || parsed.noteId !== noteId) {
    throw new HttpError(400, "File must be uploaded to this note's drafts folder.", "BAD_PATH");
  }
  const limit = await maxUploadBytes();
  if (file.fileSizeBytes > limit) throw new HttpError(413, `File exceeds the ${Math.round(limit / 1048576)} MB limit.`, "TOO_LARGE");

  const meta = await getBlobMeta(file.storagePath);
  if (!meta) throw new HttpError(400, "Uploaded file not found or mismatched.", "FILE_MISSING");
  if (meta.size !== file.fileSizeBytes || meta.contentType !== "application/pdf") {
    throw new HttpError(400, "Uploaded file not found or mismatched.", "FILE_MISMATCH");
  }
  if (!(await isBlobComplete(meta))) throw new HttpError(400, "The upload didn't finish — some parts of the file are missing. Upload it again.", "FILE_INCOMPLETE");
  // Magic-byte check: a real PDF starts with "%PDF-".
  const head = await readBlobHead(file.storagePath, 5);
  if (head.toString("latin1") !== "%PDF-") {
    await safeDelete(file.storagePath);
    throw new HttpError(400, "That file is not a valid PDF.", "NOT_PDF");
  }
}

interface ResolvedCatalog {
  subject: SubjectDoc;
  semester: SemesterDoc;
  program: ProgramDoc;
  department: DepartmentDoc | null;
}

async function resolveCatalog(programId: string, semesterId: string, subjectId: string): Promise<ResolvedCatalog> {
  const db = adminDb();
  const [subSnap, semSnap, progSnap] = await Promise.all([
    db.collection(COLLECTIONS.subjects).doc(subjectId).get(),
    db.collection(COLLECTIONS.semesters).doc(semesterId).get(),
    db.collection(COLLECTIONS.programs).doc(programId).get(),
  ]);
  const subject = docToRaw<SubjectDoc>(subSnap);
  const semester = docToRaw<SemesterDoc>(semSnap);
  const program = docToRaw<ProgramDoc>(progSnap);
  if (!subject || !semester || !program) throw new HttpError(404, "Selected program, semester or subject no longer exists.", "CATALOG_NOT_FOUND");
  if (subject.semesterId !== semester.id) throw new HttpError(400, "That subject doesn't belong to the selected semester.", "CATALOG_MISMATCH");
  if (semester.programId !== program.id) throw new HttpError(400, "That semester doesn't belong to the selected program.", "CATALOG_MISMATCH");
  const deptSnap = await db.collection(COLLECTIONS.departments).doc(program.departmentId).get();
  return { subject, semester, program, department: docToRaw<DepartmentDoc>(deptSnap) };
}

function unitTitleOf(subject: SubjectDoc, unitNumber: number | null): string | null {
  if (unitNumber === null) return null;
  return subject.units?.find((u) => u.number === unitNumber)?.title ?? null;
}

export { computeSearchTokens } from "@/lib/note-tokens";

function denormalised(c: ResolvedCatalog) {
  return {
    universityId: c.program.universityId,
    departmentId: c.program.departmentId,
    programId: c.program.id,
    semesterId: c.semester.id,
    subjectId: c.subject.id,
    subjectName: c.subject.name,
    subjectCode: c.subject.code,
    semesterNumber: c.semester.number,
    programName: c.program.name,
    programSlug: c.program.slug,
  };
}

async function readNote(id: string): Promise<Note> {
  const snap = await notesCol().doc(id).get();
  const note = docToData<NoteDoc>(snap);
  if (!note) throw new HttpError(404, "Note not found.", "NOT_FOUND");
  return note;
}

async function requireNote(id: string): Promise<NoteDoc> {
  const n = await getNoteRaw(id);
  if (!n) throw new HttpError(404, "Note not found.", "NOT_FOUND");
  return n;
}

export async function findDuplicates(note: Pick<NoteDoc, "id" | "contentHash" | "subjectId" | "titleLower">): Promise<NoteSummary[]> {
  const [byHash, byTitle] = await Promise.all([
    note.contentHash ? findNotesByHash(note.contentHash, note.id) : Promise.resolve([]),
    findNotesByTitle(note.subjectId, note.titleLower, note.id),
  ]);
  const seen = new Set<string>();
  return [...byHash, ...byTitle].filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
}

/**
 * Move the note's file between areas (drafts ↔ published) safely:
 * copy → verify → caller updates Firestore → delete source.
 * Returns both paths so the caller can roll back (delete `dst`) or finish (delete `src`).
 */
async function copyVerified(srcPath: string, dstPath: string) {
  await copyBlob(srcPath, dstPath);
  return { src: srcPath, dst: dstPath };
}

// ── Public API ──────────────────────────────────────────────────

export async function prepareUpload(input: { originalFileName: string; fileSizeBytes: number; mimeType: string }) {
  const limit = await maxUploadBytes();
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(input.mimeType)) throw new HttpError(415, "Only PDF files are allowed.", "BAD_TYPE");
  if (!input.originalFileName.toLowerCase().endsWith(".pdf")) throw new HttpError(415, "Only .pdf files are allowed.", "BAD_TYPE");
  if (input.fileSizeBytes <= 0) throw new HttpError(400, "The file is empty.", "EMPTY");
  if (input.fileSizeBytes > limit) throw new HttpError(413, `File exceeds the ${Math.round(limit / 1048576)} MB limit.`, "TOO_LARGE");
  const noteId = notesCol().doc().id;
  return { noteId, storagePath: draftPath(noteId, input.originalFileName), maxUploadBytes: limit, chunkBytes: UPLOAD_CHUNK_BYTES };
}

/** Store one chunk of an admin upload (PUT /api/admin/notes/upload). */
export async function uploadChunk(query: UploadChunkQuery, data: Buffer): Promise<{ chunkCount: number }> {
  const limit = await maxUploadBytes();
  if (query.size > limit) throw new HttpError(413, `File exceeds the ${Math.round(limit / 1048576)} MB limit.`, "TOO_LARGE");
  return writeBlobChunk(query.path, { size: query.size, index: query.index, data });
}

export async function createDraft(session: AdminSession, input: CreateNoteInput): Promise<{ note: Note; duplicates: NoteSummary[] }> {
  await verifyUploadedFile(input.file, input.noteId);
  const catalog = await resolveCatalog(input.programId, input.semesterId, input.subjectId);
  if (input.unitNumber !== null && !catalog.subject.units.some((u) => u.number === input.unitNumber)) {
    throw new HttpError(400, `Unit ${input.unitNumber} isn't defined for this subject.`, "BAD_UNIT");
  }
  const ref = notesCol().doc(input.noteId);
  const unitTitle = unitTitleOf(catalog.subject, input.unitNumber);
  const base = {
    title: input.title,
    titleLower: input.title.toLowerCase(),
    slug: slugify(input.title),
    description: input.description,
    unitNumber: input.unitNumber,
    unitTitle,
    resourceType: input.resourceType,
    tags: Array.from(new Set(input.tags)),
    ...denormalised(catalog),
  };
  const searchTokens = computeSearchTokens({ ...base, programShortName: catalog.program.shortName });

  await adminDb().runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists) throw new HttpError(409, "A note with this id already exists.", "EXISTS");
    tx.create(ref, {
      ...base,
      searchTokens,
      originalFileName: input.file.originalFileName,
      storagePath: input.file.storagePath,
      mimeType: input.file.mimeType,
      fileSizeBytes: input.file.fileSizeBytes,
      contentHash: input.file.contentHash,
      pageCount: input.file.pageCount,
      status: "draft",
      version: 1,
      uploadedBy: session.uid,
      publishedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  const note = await readNote(input.noteId);
  await writeAuditLog(session, "note.create", COLLECTIONS.notes, note.id, { title: note.title });
  const duplicates = await findDuplicates({ id: note.id, contentHash: note.contentHash, subjectId: note.subjectId, titleLower: note.titleLower });
  return { note, duplicates };
}

export async function updateNote(session: AdminSession, id: string, patch: UpdateNoteInput): Promise<Note> {
  const current = await requireNote(id);
  const programId = patch.programId ?? current.programId;
  const semesterId = patch.semesterId ?? current.semesterId;
  const subjectId = patch.subjectId ?? current.subjectId;
  const catalog = await resolveCatalog(programId, semesterId, subjectId);
  const unitNumber = patch.unitNumber !== undefined ? patch.unitNumber : current.unitNumber;
  // Only re-validate the unit when it (or the subject) is being changed, so an
  // unrelated edit never fails because the syllabus changed after upload.
  const unitChanged = patch.unitNumber !== undefined || subjectId !== current.subjectId;
  if (unitChanged && unitNumber !== null && !catalog.subject.units.some((u) => u.number === unitNumber)) {
    throw new HttpError(400, `Unit ${unitNumber} isn't defined for this subject.`, "BAD_UNIT");
  }
  const title = patch.title ?? current.title;
  const next = {
    title,
    titleLower: title.toLowerCase(),
    slug: slugify(title),
    description: patch.description ?? current.description,
    unitNumber,
    unitTitle: unitTitleOf(catalog.subject, unitNumber),
    resourceType: patch.resourceType ?? current.resourceType,
    tags: patch.tags ? Array.from(new Set(patch.tags)) : current.tags,
    ...denormalised(catalog),
  };
  await notesCol()
    .doc(id)
    .update({ ...next, searchTokens: computeSearchTokens({ ...next, programShortName: catalog.program.shortName }), updatedAt: FieldValue.serverTimestamp() });
  await writeAuditLog(session, "note.update", COLLECTIONS.notes, id, { title, fields: Object.keys(patch) });
  if (current.status === "published") revalidatePublic();
  return readNote(id);
}

/**
 * Apply a lifecycle change only if the note is still exactly as we read it
 * (same status and same file). Combined with uniquely named copies, a request
 * that loses a race can only ever clean up its OWN copy, never the live file.
 */
async function commitIfUnchanged(id: string, expected: Pick<NoteDoc, "status" | "storagePath">, patch: Record<string, unknown>) {
  await adminDb().runTransaction(async (tx) => {
    const ref = notesCol().doc(id);
    const fresh = (await tx.get(ref)).data() as NoteDoc | undefined;
    if (!fresh) throw new HttpError(404, "The note was deleted in the meantime.", "NOT_FOUND");
    if (fresh.status === "published" && expected.status !== "published") throw new HttpError(409, "This note was just published by someone else.", "ALREADY_PUBLISHED");
    if (fresh.status !== expected.status || fresh.storagePath !== expected.storagePath) {
      throw new HttpError(409, "This note was changed by another action. Refresh and try again.", "CONFLICT");
    }
    tx.update(ref, patch);
  });
}

function wrapFailure(err: unknown, message: string, code: string): never {
  if (err instanceof HttpError) throw err;
  throw new HttpError(500, `${message}: ${err instanceof Error ? err.message : "unknown error"}.`, code);
}

export async function publishNote(session: AdminSession, id: string): Promise<Note> {
  const note = await requireNote(id);
  if (note.status === "published") throw new HttpError(409, "This note is already published.", "ALREADY_PUBLISHED");
  if (!isDraftPath(note.storagePath)) throw new HttpError(409, "The note's file isn't in the drafts area.", "BAD_STATE");
  const parsed = parseNotePath(note.storagePath)!;
  // Unique object per attempt: concurrent publishers never share a destination.
  const dstPath = publishedPath(id, versionedFileName(parsed.fileName));

  let copied: Awaited<ReturnType<typeof copyVerified>> | null = null;
  try {
    copied = await copyVerified(note.storagePath, dstPath);
    await commitIfUnchanged(id, note, { status: "published", storagePath: dstPath, publishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  } catch (err) {
    if (copied) await safeDelete(copied.dst);
    wrapFailure(err, "Publish failed (the note is still a draft)", "PUBLISH_FAILED");
  }
  // Firestore now points at the published copy; the draft copy is redundant.
  await safeDelete(copied.src);
  await writeAuditLog(session, "note.publish", COLLECTIONS.notes, id, { title: note.title });
  revalidatePublic();
  return readNote(id);
}

async function moveToDrafts(session: AdminSession, id: string, status: "draft" | "archived"): Promise<Note> {
  const note = await requireNote(id);
  if (note.status === status) throw new HttpError(409, `This note is already ${status === "draft" ? "a draft" : "archived"}.`, "NO_CHANGE");
  const parsed = parseNotePath(note.storagePath);
  if (!parsed) throw new HttpError(409, "The note's file path is invalid.", "BAD_STATE");

  if (!isDraftPath(note.storagePath)) {
    const dstPath = draftPath(id, versionedFileName(parsed.fileName));
    let copied: Awaited<ReturnType<typeof copyVerified>> | null = null;
    try {
      copied = await copyVerified(note.storagePath, dstPath);
      await commitIfUnchanged(id, note, { status, storagePath: dstPath, publishedAt: null, updatedAt: FieldValue.serverTimestamp() });
    } catch (err) {
      if (copied) await safeDelete(copied.dst);
      wrapFailure(err, `Could not ${status === "draft" ? "unpublish" : "archive"} (nothing was changed)`, "MOVE_FAILED");
    }
    await safeDelete(copied.src);
  } else {
    await commitIfUnchanged(id, note, { status, publishedAt: null, updatedAt: FieldValue.serverTimestamp() });
  }
  await writeAuditLog(session, status === "draft" ? "note.unpublish" : "note.archive", COLLECTIONS.notes, id, { title: note.title, status });
  if (note.status === "published") revalidatePublic();
  return readNote(id);
}

export const unpublishNote = (s: AdminSession, id: string) => moveToDrafts(s, id, "draft");
export const archiveNote = (s: AdminSession, id: string) => moveToDrafts(s, id, "archived");

export async function replaceFile(session: AdminSession, id: string, file: UploadedFileInput): Promise<Note> {
  const note = await requireNote(id);
  if (file.storagePath === note.storagePath) throw new HttpError(400, "That is already the current file.", "NO_CHANGE");
  await verifyUploadedFile(file, id);
  const oldFile = note.storagePath;
  const newDraft = file.storagePath;
  const fileFields = {
    originalFileName: file.originalFileName,
    mimeType: file.mimeType,
    fileSizeBytes: file.fileSizeBytes,
    contentHash: file.contentHash,
    pageCount: file.pageCount,
    version: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (note.status === "published") {
    // Publish the new version under a fresh object name; the old one stays live until the commit.
    const dstPath = publishedPath(id, versionedFileName(parseNotePath(file.storagePath)!.fileName));
    let copied: Awaited<ReturnType<typeof copyVerified>> | null = null;
    try {
      copied = await copyVerified(file.storagePath, dstPath);
      await commitIfUnchanged(id, note, { ...fileFields, storagePath: dstPath });
    } catch (err) {
      if (copied) await safeDelete(copied.dst);
      await safeDelete(newDraft);
      wrapFailure(err, "Replacing the file failed (the old file is still live)", "REPLACE_FAILED");
    }
    await safeDelete(oldFile);
    await safeDelete(newDraft);
    revalidatePublic();
  } else {
    try {
      await commitIfUnchanged(id, note, { ...fileFields, storagePath: file.storagePath });
    } catch (err) {
      await safeDelete(newDraft);
      wrapFailure(err, "Replacing the file failed", "REPLACE_FAILED");
    }
    await safeDelete(oldFile);
  }
  await writeAuditLog(session, "note.replaceFile", COLLECTIONS.notes, id, { title: note.title, fileName: file.originalFileName });
  return readNote(id);
}

export async function deleteNote(session: AdminSession, id: string): Promise<void> {
  const note = await requireNote(id);
  // Remove every stored file for this note id (draft, published and orphaned uploads).
  await deleteBlobsForNote(id).catch((e) => console.error("[notes] delete files", e));
  await notesCol().doc(id).delete();
  await writeAuditLog(session, "note.delete", COLLECTIONS.notes, id, { title: note.title });
  if (note.status === "published") revalidatePublic();
}

/** Stream a note's current file (any status) — used by the admin preview route. */
export async function streamNoteFile(note: Pick<NoteDoc, "id" | "storagePath" | "originalFileName">, opts: { download?: boolean; head?: boolean }): Promise<Response> {
  const meta = await getBlobMeta(note.storagePath);
  if (!meta) throw new HttpError(404, "File not found in storage.", "FILE_MISSING");
  const size = meta.size;
  const name = (note.originalFileName || `${note.id}.pdf`).replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Length": String(size),
    "Content-Disposition": `${opts.download ? "attachment" : "inline"}; filename="${name}"; filename*=UTF-8''${encodeURIComponent(note.originalFileName || name)}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (opts.head) return new Response(null, { headers });
  return new Response(blobReadStream(meta), { headers });
}
