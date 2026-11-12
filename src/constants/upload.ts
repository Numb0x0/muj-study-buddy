/** Default upload ceiling; siteSettings.maxUploadMb can lower it, the server hard-caps it. */
export const DEFAULT_MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB ?? 25);
export const HARD_MAX_UPLOAD_MB = 25;
export const ALLOWED_MIME_TYPES = ["application/pdf"] as const;
export const ALLOWED_EXTENSIONS = [".pdf"] as const;

/**
 * PDFs are stored in Firestore (Spark plan has no Cloud Storage) as a metadata
 * doc plus fixed-size chunk docs. Firestore caps a document at 1 MiB, so a
 * chunk is 960 KiB. The browser uploads one chunk per request, and the PDF
 * viewer asks for byte ranges of exactly this size, so each range request reads
 * one chunk document.
 */
export const UPLOAD_CHUNK_BYTES = 960 * 1024;

export const mbToBytes = (mb: number) => Math.floor(mb * 1024 * 1024);
