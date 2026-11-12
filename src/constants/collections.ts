/** Firestore collection names — the single source of truth. */
export const COLLECTIONS = {
  universities: "universities",
  departments: "departments",
  programs: "programs",
  semesters: "semesters",
  subjects: "subjects",
  notes: "notes",
  faculty: "faculty",
  siteSettings: "siteSettings",
  auditLogs: "auditLogs",
  communityItems: "communityItems",
  announcements: "announcements",
  /** Uploaded PDF bytes (metadata doc + `chunks` subcollection). Server-only; see lib/storage/blob-store.ts. */
  fileBlobs: "fileBlobs",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/** Session cookie name. `__session` is the only cookie Firebase Hosting forwards; harmless elsewhere. */
export const SESSION_COOKIE = "__session";
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
