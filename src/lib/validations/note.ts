import { z } from "zod";
import { RESOURCE_TYPES } from "@/types/note";
import { idSchema, longText, paginationSchema, shortText } from "./common";
import { ALLOWED_MIME_TYPES } from "@/constants/upload";

export const tagSchema = z.string().trim().min(1).max(32).toLowerCase();

/** Metadata the admin fills in when creating / editing a note (file handled separately). */
export const noteMetadataInput = z.object({
  programId: idSchema,
  semesterId: idSchema,
  subjectId: idSchema,
  title: shortText,
  description: longText.default(""),
  unitNumber: z.number().int().min(1).max(20).nullable().default(null),
  resourceType: z.enum(RESOURCE_TYPES),
  tags: z.array(tagSchema).max(15).default([]),
});
export type NoteMetadataInput = z.infer<typeof noteMetadataInput>;

const draftPathSchema = z.string().trim().min(1).max(512).regex(/^notes\/drafts\/[A-Za-z0-9_-]+\/[^/]+$/, "File must be in the drafts area");

/** Details of a file the browser has already uploaded into notes/drafts/{noteId}/. */
export const uploadedFileInput = z.object({
  originalFileName: z.string().trim().min(1).max(255),
  storagePath: draftPathSchema,
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  fileSizeBytes: z.number().int().min(1),
  contentHash: z.string().trim().regex(/^[a-f0-9]{64}$/).nullable().default(null),
  pageCount: z.number().int().min(1).nullable().default(null),
});
export type UploadedFileInput = z.infer<typeof uploadedFileInput>;

/** POST /api/admin/notes — create a draft. */
export const createNoteInput = noteMetadataInput.extend({
  /** Pre-allocated note id that the file was uploaded under. */
  noteId: idSchema,
  file: uploadedFileInput,
});
export type CreateNoteInput = z.infer<typeof createNoteInput>;

/**
 * PATCH /api/admin/notes/[id] — edit metadata. Every field optional and with NO
 * defaults: in Zod 4, `.partial()` still applies inner `.default()`s, which would
 * silently reset omitted fields (unit → null, tags → [], description → "").
 */
export const updateNoteInput = z.object({
  programId: idSchema.optional(),
  semesterId: idSchema.optional(),
  subjectId: idSchema.optional(),
  title: shortText.optional(),
  description: longText.optional(),
  unitNumber: z.number().int().min(1).max(20).nullable().optional(),
  resourceType: z.enum(RESOURCE_TYPES).optional(),
  tags: z.array(tagSchema).max(15).optional(),
});
export type UpdateNoteInput = z.infer<typeof updateNoteInput>;

/** PUT /api/admin/notes/upload?path=…&index=…&size=… — one chunk of an upload (raw bytes in the body). */
export const uploadChunkQuery = z.object({
  path: draftPathSchema,
  index: z.coerce.number().int().min(0).max(10_000),
  // Upper bound enforced by the service (413 against the site's upload limit).
  size: z.coerce.number().int().min(1),
});
export type UploadChunkQuery = z.infer<typeof uploadChunkQuery>;

/** POST /api/admin/notes/[id]/replace-file */
export const replaceFileInput = z.object({ file: uploadedFileInput });

/** GET /api/notes (public search). */
export const noteSearchInput = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  programId: idSchema.optional(),
  departmentId: idSchema.optional(),
  semesterId: idSchema.optional(),
  subjectId: idSchema.optional(),
  unit: z.coerce.number().int().min(1).max(20).optional(),
  /** A concrete resource type, or "lab" for lab manuals + experiments + viva together. */
  type: z.enum([...RESOURCE_TYPES, "lab"]).optional(),
  tag: tagSchema.optional(),
  /** Uploaded within the last N days. */
  since: z.coerce.number().int().min(1).max(3650).optional(),
  sort: z.enum(["newest", "oldest", "title"]).default("newest"),
});
export type NoteSearchInput = z.infer<typeof noteSearchInput>;

/** Admin listing with status filter. */
export const adminNoteListInput = noteSearchInput.extend({
  status: z.enum(["draft", "published", "archived", "all"]).default("all"),
});
export type AdminNoteListInput = z.infer<typeof adminNoteListInput>;
