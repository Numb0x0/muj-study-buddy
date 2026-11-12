import "server-only";
import { FieldPath, Timestamp, type Query, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { HttpError } from "@/lib/auth/require-admin";
import { adminDb } from "@/lib/firebase/admin";
import { docToData, docToRaw } from "@/lib/firebase/serialize";
import { COLLECTIONS } from "@/constants/collections";
import { DEFAULT_PAGE_SIZE, LAB_RESOURCE_TYPES, MAX_PAGE_SIZE } from "@/constants/resources";
import { matchesAllTokens, pickPrimaryToken, tokenizeQuery } from "@/lib/search";
import type { AdminNoteListInput, NoteSearchInput } from "@/lib/validations/note";
import type { Note, NoteDoc, NoteSummary, PaginatedResult } from "@/types";

const notesCol = () => adminDb().collection(COLLECTIONS.notes);

export function toSummary(n: Note): NoteSummary {
  return {
    id: n.id,
    title: n.title,
    slug: n.slug,
    description: n.description,
    resourceType: n.resourceType,
    unitNumber: n.unitNumber,
    unitTitle: n.unitTitle,
    tags: n.tags,
    fileSizeBytes: n.fileSizeBytes,
    pageCount: n.pageCount,
    status: n.status,
    subjectId: n.subjectId,
    subjectName: n.subjectName,
    subjectCode: n.subjectCode,
    semesterId: n.semesterId,
    semesterNumber: n.semesterNumber,
    programId: n.programId,
    programName: n.programName,
    programSlug: n.programSlug,
    publishedAt: n.publishedAt,
    updatedAt: n.updatedAt,
    createdAt: n.createdAt,
  };
}

/**
 * Fields that may appear in public JSON. An explicit allowlist (not "everything
 * minus a denylist") so fields added later — or left on old documents — are
 * never exposed by accident.
 */
const PUBLIC_NOTE_FIELDS = [
  "id", "universityId", "departmentId", "programId", "semesterId", "subjectId",
  "title", "slug", "description", "unitNumber", "unitTitle", "resourceType", "tags",
  "originalFileName", "mimeType", "fileSizeBytes", "pageCount", "status", "version",
  "publishedAt", "createdAt", "updatedAt",
  "subjectName", "subjectCode", "semesterNumber", "programName", "programSlug",
] as const satisfies readonly (keyof Note)[];

export type PublicNote = Pick<Note, (typeof PUBLIC_NOTE_FIELDS)[number]>;

export function toPublicNote(n: Note): PublicNote {
  const out: Record<string, unknown> = {};
  for (const k of PUBLIC_NOTE_FIELDS) out[k] = n[k];
  return out as PublicNote;
}

// ── Point reads ─────────────────────────────────────────────────

/** Published note or null (never returns drafts). */
export async function getPublishedNote(id: string): Promise<Note | null> {
  const snap = await notesCol().doc(id).get();
  const note = docToData<NoteDoc>(snap);
  return note && note.status === "published" ? note : null;
}

/** Admin: any status. Raw (Timestamps intact) for server-side workflows. */
export async function getNoteRaw(id: string): Promise<NoteDoc | null> {
  const snap = await notesCol().doc(id).get();
  return docToRaw<NoteDoc>(snap);
}

export async function getNoteAdmin(id: string): Promise<Note | null> {
  const snap = await notesCol().doc(id).get();
  return docToData<NoteDoc>(snap);
}

// ── Listing / search ────────────────────────────────────────────

interface BuildOpts {
  status: "published" | "draft" | "archived" | "all";
}

/** Firestore caps the cross-product of `in` filters at 30 disjunctions. */
const MAX_DISJUNCTIONS = 30;
const ALL_STATUSES = ["draft", "published", "archived"] as const;

/**
 * Translate search input into a Firestore query whose shape is always covered
 * by firestore.indexes.json (see scripts/generate-indexes.mjs):
 *
 *   status (== or in) · [one scope: subject | semester | program (== or in)]
 *   · [resourceType (== or in)] · [unitNumber ==] · [searchTokens | tags array-contains]
 *   · orderBy(publishedAt | updatedAt), orderBy(__name__)
 *
 * Extra free-text tokens (and a tag combined with text) are checked in memory.
 */
async function buildQuery(input: NoteSearchInput, opts: BuildOpts): Promise<{ q: Query; memory: MemoryFilter; orderField: "publishedAt" | "updatedAt"; dir: "asc" | "desc" }> {
  let q: Query = notesCol();
  const memory: MemoryFilter = { tokens: [], tag: null };
  let disjunctions = 1;

  if (opts.status === "all") {
    // `in` keeps every admin query on the status-prefixed indexes.
    q = q.where("status", "in", [...ALL_STATUSES]);
    disjunctions *= ALL_STATUSES.length;
  } else {
    q = q.where("status", "==", opts.status);
  }

  let typeFilter: string[] | null = null;
  if (input.type === "lab") typeFilter = [...LAB_RESOURCE_TYPES];
  else if (input.type) typeFilter = [input.type];
  if (typeFilter && typeFilter.length > 1) disjunctions *= typeFilter.length;

  if (input.subjectId) q = q.where("subjectId", "==", input.subjectId);
  else if (input.semesterId) q = q.where("semesterId", "==", input.semesterId);
  else if (input.programId) q = q.where("programId", "==", input.programId);
  else if (input.departmentId) {
    // Department filter → programs of that department (shares the programId index).
    const budget = Math.max(1, Math.floor(MAX_DISJUNCTIONS / disjunctions));
    const progSnap = await adminDb().collection(COLLECTIONS.programs).where("departmentId", "==", input.departmentId).get();
    const ids = progSnap.docs.map((d) => d.id);
    if (ids.length > budget) throw new HttpError(400, "This department has too many programs to combine with these filters. Pick a program instead.", "TOO_MANY_FILTERS");
    q = q.where("programId", "in", ids.length ? ids : ["__none__"]);
  }

  if (typeFilter) q = typeFilter.length === 1 ? q.where("resourceType", "==", typeFilter[0]) : q.where("resourceType", "in", typeFilter);
  if (input.unit) q = q.where("unitNumber", "==", input.unit);

  const tokens = input.q ? tokenizeQuery(input.q) : [];
  const primary = pickPrimaryToken(tokens);
  if (primary) {
    q = q.where("searchTokens", "array-contains", primary);
    memory.tokens = tokens;
    if (input.tag) memory.tag = input.tag; // only one array-contains per query
  } else if (input.tag) {
    q = q.where("tags", "array-contains", input.tag);
  }

  const orderField = opts.status === "published" ? "publishedAt" : "updatedAt";
  const dir = input.sort === "oldest" && opts.status === "published" ? "asc" : "desc";
  if (input.since) {
    const since = Timestamp.fromDate(new Date(Date.now() - input.since * 86_400_000));
    q = q.where(orderField, ">=", since);
  }
  // Document id as tie-breaker makes cursors stable even when timestamps collide.
  q = q.orderBy(orderField, dir).orderBy(FieldPath.documentId(), dir);
  return { q, memory, orderField, dir };
}

interface MemoryFilter {
  tokens: string[];
  tag: string | null;
}

function applyMemoryFilters(doc: NoteDoc, m: MemoryFilter): boolean {
  if (m.tokens.length && !matchesAllTokens(doc.searchTokens ?? [], m.tokens)) return false;
  if (m.tag && !(doc.tags ?? []).includes(m.tag)) return false;
  return true;
}

// ── Cursors ─────────────────────────────────────────────────────
// Opaque cursor = (order-field value, document id). It does not depend on the
// cursor document's *current* state, so editing/deleting/unpublishing the last
// item on a page never makes "Load more" repeat or stop early.

interface CursorData {
  t: number;
  id: string;
}

function encodeCursor(doc: QueryDocumentSnapshot, orderField: string): string {
  const v = doc.get(orderField) as Timestamp | null | undefined;
  const data: CursorData = { t: v ? v.toMillis() : 0, id: doc.id };
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

function decodeCursor(cursor: string): CursorData {
  try {
    const data = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Partial<CursorData>;
    if (typeof data.t === "number" && Number.isFinite(data.t) && typeof data.id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(data.id)) {
      return { t: data.t, id: data.id };
    }
  } catch {
    /* fall through */
  }
  throw new HttpError(400, "Invalid page cursor.", "BAD_CURSOR");
}

/** Max documents scanned per request when in-memory filters are active. */
const MAX_SCAN_ROUNDS = 5;

async function paginate(
  base: Query,
  memory: MemoryFilter,
  orderField: string,
  limit: number,
  cursor: string | undefined,
): Promise<PaginatedResult<Note>> {
  let q = base;
  if (cursor) {
    const c = decodeCursor(cursor);
    q = q.startAfter(Timestamp.fromMillis(c.t), c.id);
  }
  const needsMemory = memory.tokens.length > 0 || memory.tag !== null;
  const batch = needsMemory ? Math.min(limit * 4, 200) : limit + 1;

  const matches: { note: Note; snap: QueryDocumentSnapshot }[] = [];
  let lastScanned: QueryDocumentSnapshot | null = null;
  let exhausted = false;
  let rounds = 0;

  while (matches.length <= limit && !exhausted && rounds < MAX_SCAN_ROUNDS) {
    rounds++;
    const pageQuery: Query = lastScanned ? q.startAfter(lastScanned).limit(batch) : q.limit(batch);
    const snap: FirebaseFirestore.QuerySnapshot = await pageQuery.get();
    for (const d of snap.docs) {
      lastScanned = d;
      if (!applyMemoryFilters(docToRaw<NoteDoc>(d)!, memory)) continue;
      matches.push({ note: docToData<NoteDoc>(d)!, snap: d });
      if (matches.length > limit) break;
    }
    if (snap.size < batch) exhausted = true;
  }

  if (matches.length > limit) {
    const page = matches.slice(0, limit);
    return { items: page.map((m) => m.note), hasMore: true, nextCursor: encodeCursor(page[page.length - 1].snap, orderField) };
  }
  // Stopped because of the scan budget, not because results ran out:
  // let the client continue from the last document we looked at.
  if (!exhausted && lastScanned) {
    return { items: matches.map((m) => m.note), hasMore: true, nextCursor: encodeCursor(lastScanned, orderField) };
  }
  return { items: matches.map((m) => m.note), hasMore: false, nextCursor: null };
}

/** Public search — published only. */
export async function searchPublishedNotes(input: NoteSearchInput): Promise<PaginatedResult<NoteSummary>> {
  const limit = Math.min(input.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const { q, memory, orderField } = await buildQuery(input, { status: "published" });
  const res = await paginate(q, memory, orderField, limit, input.cursor);
  return { ...res, items: res.items.map(toSummary) };
}

/** Admin listing — any status, ordered by updatedAt. */
export async function listNotesAdmin(input: AdminNoteListInput): Promise<PaginatedResult<Note>> {
  const limit = Math.min(input.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const { q, memory, orderField } = await buildQuery(input, { status: input.status });
  return paginate(q, memory, orderField, limit, input.cursor);
}

/** Latest published notes for the homepage / sidebars. */
export async function getRecentNotes(limit = 6): Promise<NoteSummary[]> {
  const snap = await notesCol().where("status", "==", "published").orderBy("publishedAt", "desc").limit(limit).get();
  return snap.docs.map((d) => toSummary(docToData<NoteDoc>(d)!));
}

/** All published notes of a subject, grouped by resource type by the caller. */
export async function getPublishedNotesBySubject(subjectId: string): Promise<NoteSummary[]> {
  const snap = await notesCol().where("status", "==", "published").where("subjectId", "==", subjectId).orderBy("publishedAt", "desc").limit(200).get();
  return snap.docs.map((d) => toSummary(docToData<NoteDoc>(d)!));
}

/** Same subject, excluding the current note. */
export async function getRelatedNotes(note: Pick<Note, "id" | "subjectId">, limit = 6): Promise<NoteSummary[]> {
  const all = await getPublishedNotesBySubject(note.subjectId);
  return all.filter((n) => n.id !== note.id).slice(0, limit);
}

/** Count aggregate — used for honest stats (no fabricated numbers). */
export async function countPublishedNotes(filter?: { subjectId?: string; semesterId?: string; programId?: string }): Promise<number> {
  let q: Query = notesCol().where("status", "==", "published");
  if (filter?.subjectId) q = q.where("subjectId", "==", filter.subjectId);
  else if (filter?.semesterId) q = q.where("semesterId", "==", filter.semesterId);
  else if (filter?.programId) q = q.where("programId", "==", filter.programId);
  const agg = await q.count().get();
  return agg.data().count;
}

/** Per-subject published counts for a list of subjects (parallel aggregates). */
export async function countPublishedBySubject(subjectIds: string[]): Promise<Record<string, number>> {
  const entries = await Promise.all(subjectIds.map(async (id) => [id, await countPublishedNotes({ subjectId: id })] as const));
  return Object.fromEntries(entries);
}

export async function countNotesByStatus(): Promise<Record<"draft" | "published" | "archived", number>> {
  const [d, p, a] = await Promise.all(
    (["draft", "published", "archived"] as const).map((s) => notesCol().where("status", "==", s).count().get()),
  );
  return { draft: d.data().count, published: p.data().count, archived: a.data().count };
}

/** Find other notes with the same content hash (duplicate warning). */
export async function findNotesByHash(contentHash: string, excludeId?: string): Promise<NoteSummary[]> {
  const snap = await notesCol().where("contentHash", "==", contentHash).limit(5).get();
  return snap.docs
    .map((d) => docToData<NoteDoc>(d)!)
    .filter((n) => n.id !== excludeId)
    .map(toSummary);
}

/** Notes with an identical normalised title under the same subject (soft duplicate warning). */
export async function findNotesByTitle(subjectId: string, titleLower: string, excludeId?: string): Promise<NoteSummary[]> {
  const snap = await notesCol().where("subjectId", "==", subjectId).where("titleLower", "==", titleLower).limit(5).get();
  return snap.docs
    .map((d) => docToData<NoteDoc>(d)!)
    .filter((n) => n.id !== excludeId)
    .map(toSummary);
}
