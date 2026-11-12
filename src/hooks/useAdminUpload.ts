"use client";

/**
 * Browser upload flow for admin PDFs (docs/API.md § "Browser upload flow").
 *
 *   validate → prepare (allocate noteId + storagePath) → upload in chunks
 *   (PUT /api/admin/notes/upload, with progress + retries) while hashing
 *   (SHA-256) and counting pages (pdfjs, best effort)
 *   → `fileMeta` ready for POST /api/admin/notes or …/replace-file.
 *
 * Uploads are authorised by the admin session cookie, exactly like every other
 * admin API call. The bytes are stored in Firestore (Spark plan, no Cloud
 * Storage), so each request carries one ≤ 960 KiB chunk.
 *
 * Pass `{ noteId }` to `start()` to upload under an EXISTING note (replace-file
 * flow); the path is then computed client-side with `draftPath()` and the
 * prepare step is skipped.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { draftPath, versionedFileName } from "@/lib/storage/paths";
import { ALLOWED_EXTENSIONS, HARD_MAX_UPLOAD_MB, mbToBytes, UPLOAD_CHUNK_BYTES } from "@/constants/upload";
import { formatBytes } from "@/lib/utils";
import { PDF_WORKER_SRC } from "@/lib/pdf-worker";
import type { UploadedFileInput } from "@/lib/validations/note";

export type UploadState = "idle" | "validating" | "preparing" | "uploading" | "done" | "error";

export interface UseAdminUploadOptions {
  /** Upload ceiling in bytes (from site settings). Defaults to the server's hard cap. */
  maxUploadBytes?: number;
}

export interface StartOptions {
  /** Upload under this existing note id instead of allocating a new one. */
  noteId?: string;
}

export interface AdminUploadApi {
  state: UploadState;
  /** 0–100 */
  progress: number;
  noteId: string | null;
  storagePath: string | null;
  fileMeta: UploadedFileInput | null;
  error: string | null;
  /** Error classification, useful for showing a sign-in link. */
  errorCode: "VALIDATION" | "UNAUTHORIZED" | "CANCELED" | "NETWORK" | "PREPARE" | "UNKNOWN" | null;
  file: File | null;
  /** Resolves to the uploaded file details, or null on failure/cancel. */
  start: (file: File, opts?: StartOptions) => Promise<UploadedFileInput | null>;
  cancel: () => void;
  reset: () => void;
}

export const SESSION_EXPIRED_MESSAGE = "Your admin session has expired. Sign in again, then retry the upload.";

const MAX_ATTEMPTS = 4;

/** Client-side validation mirroring the server's prepare checks. */
export function validatePdfFile(file: File, maxUploadBytes: number): string | null {
  const lower = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "Only .pdf files are allowed.";
  // Some browsers report an empty type for PDFs dragged from certain apps; accept empty + .pdf extension.
  if (file.type && file.type !== "application/pdf") return `This file is “${file.type}”, not a PDF.`;
  if (file.size <= 0) return "This file is empty.";
  if (file.size > maxUploadBytes) return `File is ${formatBytes(file.size)} — the limit is ${formatBytes(maxUploadBytes)}.`;
  return null;
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string | null> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

/** Best-effort page count via pdfjs (bundled with react-pdf). Never throws. */
async function countPdfPages(buffer: ArrayBuffer): Promise<number | null> {
  try {
    const { pdfjs } = await import("react-pdf");
    // react-pdf ships its own default; always point at our self-hosted worker.
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
    // pdfjs takes ownership of the bytes it is given; hand it a copy.
    const task = pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) });
    const doc = await task.promise;
    const pages = doc.numPages;
    await task.destroy().catch(() => undefined);
    return Number.isFinite(pages) && pages > 0 ? pages : null;
  } catch {
    return null;
  }
}

class UploadError extends Error {
  constructor(
    message: string,
    public code: NonNullable<AdminUploadApi["errorCode"]>,
    public retryable = false,
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** PUT one chunk, retrying network failures and 5xx/429 with backoff. */
async function putChunk(path: string, index: number, size: number, body: Blob, signal: AbortSignal): Promise<void> {
  const url = api.adminNotes.uploadUrl({ path, index, size });
  for (let attempt = 1; ; attempt++) {
    let error: UploadError;
    try {
      const res = await fetch(url, {
        method: "PUT",
        body,
        signal,
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/octet-stream", Accept: "application/json" },
      });
      if (res.ok) return;
      const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
      if (res.status === 401 || res.status === 403) throw new UploadError(SESSION_EXPIRED_MESSAGE, "UNAUTHORIZED");
      if (res.status === 413) throw new UploadError(data?.error ?? "File is too large.", "VALIDATION");
      if (res.status === 503) throw new UploadError("Server-side Firebase credentials are missing — see .env.example.", "PREPARE");
      error = new UploadError(data?.error ?? `Upload failed (${res.status}).`, res.status >= 500 || res.status === 429 ? "NETWORK" : "UNKNOWN", res.status >= 500 || res.status === 429);
    } catch (err) {
      if (err instanceof UploadError) throw err;
      if ((err as { name?: string })?.name === "AbortError") throw new UploadError("Upload cancelled.", "CANCELED");
      error = new UploadError("The upload kept failing — check your connection and try again.", "NETWORK", true);
    }
    if (!error.retryable || attempt >= MAX_ATTEMPTS) throw error;
    await sleep(400 * 2 ** (attempt - 1));
    if (signal.aborted) throw new UploadError("Upload cancelled.", "CANCELED");
  }
}

export function useAdminUpload(options: UseAdminUploadOptions = {}): AdminUploadApi {
  const maxUploadBytes = options.maxUploadBytes ?? mbToBytes(HARD_MAX_UPLOAD_MB);

  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<UploadedFileInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<AdminUploadApi["errorCode"]>(null);
  const [file, setFile] = useState<File | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const runRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const clear = useCallback(() => {
    runRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setState("idle");
    setProgress(0);
    setNoteId(null);
    setStoragePath(null);
    setFileMeta(null);
    setError(null);
    setErrorCode(null);
  }, []);

  const reset = useCallback(() => {
    clear();
    setFile(null);
  }, [clear]);

  const fail = useCallback((message: string, code: AdminUploadApi["errorCode"]): null => {
    if (!mountedRef.current) return null;
    setError(message);
    setErrorCode(code);
    setState("error");
    return null;
  }, []);

  const start = useCallback(
    async (picked: File, opts: StartOptions = {}): Promise<UploadedFileInput | null> => {
      const run = ++runRef.current;
      const isCurrent = () => mountedRef.current && runRef.current === run;

      setError(null);
      setErrorCode(null);
      setFileMeta(null);
      setProgress(0);
      setFile(picked);
      setState("validating");

      const validation = validatePdfFile(picked, maxUploadBytes);
      if (validation) return fail(validation, "VALIDATION");

      setState("preparing");

      let targetNoteId: string;
      let targetPath: string;
      if (opts.noteId) {
        targetNoteId = opts.noteId;
        // Unique object name so a replacement never overwrites the note's current file.
        targetPath = draftPath(opts.noteId, versionedFileName(picked.name));
      } else {
        try {
          const prep = await api.adminNotes.prepare({ originalFileName: picked.name, fileSizeBytes: picked.size, mimeType: picked.type || "application/pdf" });
          if (!isCurrent()) return null;
          if (prep.maxUploadBytes && picked.size > prep.maxUploadBytes) {
            return fail(`File is ${formatBytes(picked.size)} — the server limit is ${formatBytes(prep.maxUploadBytes)}.`, "VALIDATION");
          }
          targetNoteId = prep.noteId;
          targetPath = prep.storagePath;
        } catch (err) {
          if (!isCurrent()) return null;
          if (err instanceof ApiClientError) {
            if (err.status === 413) return fail(err.message || "File is too large.", "VALIDATION");
            if (err.status === 503) return fail("Server-side Firebase credentials are missing — copy .env.example to .env.local.", "PREPARE");
            if (err.status === 401 || err.status === 403) return fail(SESSION_EXPIRED_MESSAGE, "UNAUTHORIZED");
            return fail(err.message, err.code === "NETWORK" ? "NETWORK" : "PREPARE");
          }
          return fail("Could not prepare the upload.", "PREPARE");
        }
      }
      if (!isCurrent()) return null;
      setNoteId(targetNoteId);
      setStoragePath(targetPath);
      setState("uploading");

      // Hash + page count run alongside the upload.
      const analysis = (async () => {
        try {
          const buf = await picked.arrayBuffer();
          const [contentHash, pageCount] = await Promise.all([sha256Hex(buf), countPdfPages(buf)]);
          return { contentHash, pageCount };
        } catch {
          return { contentHash: null, pageCount: null };
        }
      })();

      const controller = new AbortController();
      abortRef.current = controller;
      const total = picked.size;
      const chunks = Math.max(1, Math.ceil(total / UPLOAD_CHUNK_BYTES));
      try {
        for (let i = 0; i < chunks; i++) {
          const from = i * UPLOAD_CHUNK_BYTES;
          const to = Math.min(total, from + UPLOAD_CHUNK_BYTES);
          await putChunk(targetPath, i, total, picked.slice(from, to), controller.signal);
          if (!isCurrent()) return null;
          setProgress(Math.min(99, Math.round((to / total) * 100)));
        }
      } catch (err) {
        if (abortRef.current === controller) abortRef.current = null;
        if (!isCurrent()) return null;
        const e = err instanceof UploadError ? err : new UploadError("Upload failed.", "UNKNOWN");
        if (e.code === "CANCELED") {
          setState("idle");
          setProgress(0);
          return null;
        }
        return fail(e.message, e.code);
      }
      if (abortRef.current === controller) abortRef.current = null;

      const { contentHash, pageCount } = await analysis;
      if (!isCurrent()) return null;

      const meta: UploadedFileInput = {
        originalFileName: picked.name,
        storagePath: targetPath,
        mimeType: "application/pdf",
        fileSizeBytes: picked.size,
        contentHash,
        pageCount,
      };
      setFileMeta(meta);
      setProgress(100);
      setState("done");
      return meta;
    },
    [fail, maxUploadBytes],
  );

  return { state, progress, noteId, storagePath, fileMeta, error, errorCode, file, start, cancel: clear, reset };
}
