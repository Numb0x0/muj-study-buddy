import type { Serialized, Timestamp, Timestamps } from "./common";

export const RESOURCE_TYPES = [
  "notes",
  "pyq",
  "assignment",
  "lab-manual",
  "lab-experiment",
  "viva",
  "reference",
  "syllabus",
  "other",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const NOTE_STATUSES = ["draft", "published", "archived"] as const;
export type NoteStatus = (typeof NOTE_STATUSES)[number];

/**
 * A "note" is any uploadable academic resource (PDF): lecture notes, PYQs,
 * assignments, lab manuals, viva questions, syllabus, reference material.
 */
export interface NoteDoc extends Timestamps {
  id: string;
  universityId: string;
  departmentId: string;
  programId: string;
  semesterId: string;
  subjectId: string;

  title: string;
  /** Lower-cased title for prefix search / sorting. */
  titleLower: string;
  /** Word + prefix tokens for lightweight search (see lib/search.ts). */
  searchTokens: string[];
  slug: string;
  description: string;
  unitNumber: number | null;
  unitTitle: string | null;
  resourceType: ResourceType;
  tags: string[];

  originalFileName: string;
  /** Current file location in Storage (drafts/… or published/…). */
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  /** SHA-256 of the file, used for duplicate warnings. */
  contentHash: string | null;
  pageCount: number | null;

  status: NoteStatus;
  version: number;
  /** Firebase uid of the uploader. (No email here: published docs are publicly readable.) */
  uploadedBy: string;
  publishedAt: Timestamp | null;

  /** Denormalised labels so list views don't need N+1 lookups. */
  subjectName: string;
  subjectCode: string;
  semesterNumber: number;
  programName: string;
  programSlug: string;
}

export type Note = Serialized<NoteDoc>;

/** Lightweight shape for list/card views. */
export type NoteSummary = Pick<
  Note,
  | "id"
  | "title"
  | "slug"
  | "description"
  | "resourceType"
  | "unitNumber"
  | "unitTitle"
  | "tags"
  | "fileSizeBytes"
  | "pageCount"
  | "status"
  | "subjectId"
  | "subjectName"
  | "subjectCode"
  | "semesterId"
  | "semesterNumber"
  | "programId"
  | "programName"
  | "programSlug"
  | "publishedAt"
  | "updatedAt"
  | "createdAt"
>;
