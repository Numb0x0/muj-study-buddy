import "server-only";

/**
 * PDF file storage on Firestore (server only).
 *
 * The project runs on Firebase's free Spark plan, which has no Cloud Storage.
 * Each file therefore lives in Firestore under the same logical path the
 * Storage layout used (`notes/drafts/{noteId}/{file}`, `notes/published/…`):
 *
 *   fileBlobs/{encodeURIComponent(path)}                metadata (size, chunk count, etag…)
 *   fileBlobs/{encodeURIComponent(path)}/chunks/{00000} { data: Bytes } — UPLOAD_CHUNK_BYTES each
 *
 * Only the Admin SDK touches these documents; firestore.rules deny all client
 * access. Public reads go through /api/files/[noteId], which checks that the
 * note is published before streaming.
 */
import { randomBytes } from "node:crypto";
import { AggregateField, FieldValue, type DocumentReference, type Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { HttpError } from "@/lib/auth/require-admin";
import { COLLECTIONS } from "@/constants/collections";
import { UPLOAD_CHUNK_BYTES } from "@/constants/upload";
import { isDraftPath, parseNotePath } from "./paths";

/** Firestore limits a batched write to 10 MiB, so copies commit this many chunks at a time. */
const COPY_BATCH_CHUNKS = 8;
const PDF_MAGIC = "%PDF-";

interface FileBlobDoc {
  path: string;
  noteId: string;
  contentType: string;
  size: number;
  chunkSize: number;
  chunkCount: number;
  etag: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BlobMeta {
  path: string;
  noteId: string;
  contentType: string;
  size: number;
  chunkSize: number;
  chunkCount: number;
  /** Quoted strong ETag, unique per stored object. */
  etag: string;
  updatedAt: Date | null;
}

export interface ByteRange {
  start: number;
  end: number;
}

// ── Addressing ──────────────────────────────────────────────────

const blobsCol = () => adminDb().collection(COLLECTIONS.fileBlobs);
/** Firestore ids can't contain "/" — encode the path reversibly. */
const blobRef = (path: string) => blobsCol().doc(encodeURIComponent(path));
const chunkRef = (blob: DocumentReference, index: number) => blob.collection("chunks").doc(String(index).padStart(5, "0"));

export const chunkCountFor = (size: number, chunkSize = UPLOAD_CHUNK_BYTES) => Math.max(1, Math.ceil(size / chunkSize));

/** Byte length chunk `index` must have for a file of `size` bytes. */
export function expectedChunkLength(size: number, index: number, chunkSize = UPLOAD_CHUNK_BYTES): number {
  const count = chunkCountFor(size, chunkSize);
  return index < count - 1 ? chunkSize : size - chunkSize * (count - 1);
}

const newEtag = () => `"${randomBytes(12).toString("hex")}"`;

function toMeta(d: FileBlobDoc): BlobMeta {
  return {
    path: d.path,
    noteId: d.noteId,
    contentType: d.contentType,
    size: d.size,
    chunkSize: d.chunkSize,
    chunkCount: d.chunkCount,
    etag: d.etag,
    updatedAt: d.updatedAt?.toDate?.() ?? null,
  };
}

// ── Reads ───────────────────────────────────────────────────────

export async function getBlobMeta(path: string): Promise<BlobMeta | null> {
  const snap = await blobRef(path).get();
  return snap.exists ? toMeta(snap.data() as FileBlobDoc) : null;
}

/** True when every chunk the metadata promises has been written. */
export async function isBlobComplete(meta: BlobMeta): Promise<boolean> {
  const agg = await blobRef(meta.path).collection("chunks").count().get();
  return agg.data().count === meta.chunkCount;
}

/** First `n` bytes of the file (n ≤ chunk size). */
export async function readBlobHead(path: string, n: number): Promise<Buffer> {
  const snap = await chunkRef(blobRef(path), 0).get();
  const data = snap.get("data") as Buffer | undefined;
  return data ? Buffer.from(data.subarray(0, n)) : Buffer.alloc(0);
}

/**
 * Stream `range` (inclusive, default whole file) as a web ReadableStream. One
 * chunk document is fetched ahead so Firestore latency overlaps with sending.
 */
export function blobReadStream(meta: BlobMeta, range?: ByteRange): ReadableStream<Uint8Array> {
  const start = range?.start ?? 0;
  const end = range?.end ?? meta.size - 1;
  const first = Math.floor(start / meta.chunkSize);
  const last = Math.floor(end / meta.chunkSize);
  const ref = blobRef(meta.path);
  const fetchChunk = (i: number) => chunkRef(ref, i).get();
  let index = first;
  let pending: ReturnType<typeof fetchChunk> | null = first <= last ? fetchChunk(first) : null;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (!pending || index > last) {
        controller.close();
        return;
      }
      try {
        const snap = await pending;
        const data = snap.get("data") as Buffer | undefined;
        if (!data) throw new Error(`chunk ${index} of ${meta.path} is missing`);
        const chunkStart = index * meta.chunkSize;
        const from = Math.max(0, start - chunkStart);
        const to = Math.min(data.length, end - chunkStart + 1);
        index += 1;
        pending = index <= last ? fetchChunk(index) : null;
        controller.enqueue(new Uint8Array(data.subarray(from, to)));
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

// ── Writes ──────────────────────────────────────────────────────

/**
 * Store one chunk of an admin upload into the drafts area. The first write
 * creates the metadata; later writes must agree on the total size. A path that
 * a note already points at is sealed and can't be overwritten.
 */
export async function writeBlobChunk(path: string, input: { size: number; index: number; data: Buffer }): Promise<{ chunkCount: number }> {
  const parsed = parseNotePath(path);
  if (!parsed || !isDraftPath(path)) throw new HttpError(400, "Uploads must go to the note's drafts area.", "BAD_PATH");
  const { size, index, data } = input;
  const chunkCount = chunkCountFor(size);
  if (index < 0 || index >= chunkCount) throw new HttpError(400, `Chunk ${index} is out of range for a ${size}-byte file.`, "BAD_CHUNK");
  if (data.length !== expectedChunkLength(size, index)) throw new HttpError(400, "Chunk has the wrong length.", "BAD_CHUNK");
  if (index === 0 && data.subarray(0, PDF_MAGIC.length).toString("latin1") !== PDF_MAGIC) {
    throw new HttpError(400, "That file is not a valid PDF.", "NOT_PDF");
  }

  const db = adminDb();
  const ref = blobRef(path);
  const noteRef = db.collection(COLLECTIONS.notes).doc(parsed.noteId);
  await db.runTransaction(async (tx) => {
    const [metaSnap, noteSnap] = await tx.getAll(ref, noteRef);
    if (noteSnap.exists && noteSnap.get("storagePath") === path) {
      throw new HttpError(409, "This file is already attached to a note and can't be changed.", "FILE_SEALED");
    }
    if (metaSnap.exists) {
      const m = metaSnap.data() as FileBlobDoc;
      if (m.size !== size || m.chunkSize !== UPLOAD_CHUNK_BYTES) throw new HttpError(409, "This upload was started with a different file size.", "SIZE_MISMATCH");
      tx.update(ref, { updatedAt: FieldValue.serverTimestamp() });
    } else {
      tx.create(ref, {
        path,
        noteId: parsed.noteId,
        contentType: "application/pdf",
        size,
        chunkSize: UPLOAD_CHUNK_BYTES,
        chunkCount,
        etag: newEtag(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    tx.set(chunkRef(ref, index), { data });
  });
  return { chunkCount };
}

/**
 * Copy a complete blob to a new path (drafts ↔ published). Chunks are written
 * first and the metadata last, then the copy is verified. Throws (after
 * removing the partial copy) if anything is missing.
 */
export async function copyBlob(srcPath: string, dstPath: string): Promise<BlobMeta> {
  const parsed = parseNotePath(dstPath);
  if (!parsed) throw new Error(`invalid destination path ${dstPath}`);
  const db = adminDb();
  const srcRef = blobRef(srcPath);
  const dstRef = blobRef(dstPath);
  const srcSnap = await srcRef.get();
  if (!srcSnap.exists) throw new HttpError(409, "The file for this note is missing from storage.", "FILE_MISSING");
  const src = srcSnap.data() as FileBlobDoc;

  try {
    for (let i = 0; i < src.chunkCount; i += COPY_BATCH_CHUNKS) {
      const refs = Array.from({ length: Math.min(COPY_BATCH_CHUNKS, src.chunkCount - i) }, (_, k) => chunkRef(srcRef, i + k));
      const snaps = await db.getAll(...refs);
      const batch = db.batch();
      snaps.forEach((s, k) => {
        const data = s.get("data") as Buffer | undefined;
        if (!data) throw new Error(`source chunk ${i + k} is missing`);
        batch.set(chunkRef(dstRef, i + k), { data });
      });
      await batch.commit();
    }
    await dstRef.set({
      ...src,
      path: dstPath,
      noteId: parsed.noteId,
      etag: newEtag(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const meta = toMeta({ ...src, path: dstPath, noteId: parsed.noteId } as FileBlobDoc);
    if (!(await isBlobComplete(meta))) throw new Error("copied file is incomplete");
    return (await getBlobMeta(dstPath)) ?? meta;
  } catch (err) {
    await deleteBlob(dstPath).catch(() => undefined);
    throw err;
  }
}

/** Delete a blob and all of its chunks. Missing blobs are ignored. */
export async function deleteBlob(path: string): Promise<void> {
  await adminDb().recursiveDelete(blobRef(path));
}

/** Delete every blob (draft, published, orphaned upload) belonging to a note. */
export async function deleteBlobsForNote(noteId: string): Promise<number> {
  const snap = await blobsCol().where("noteId", "==", noteId).select("path").get();
  await Promise.all(snap.docs.map((d) => adminDb().recursiveDelete(d.ref)));
  return snap.size;
}

/** Total bytes held in fileBlobs (drafts + published + orphans), for the Spark-plan quota display. */
export async function getStoredBytes(): Promise<number> {
  const snap = await blobsCol().aggregate({ total: AggregateField.sum("size") }).get();
  return Number(snap.data().total ?? 0);
}
