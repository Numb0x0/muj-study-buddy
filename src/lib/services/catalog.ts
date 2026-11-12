import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { docToData } from "@/lib/firebase/serialize";
import { COLLECTIONS } from "@/constants/collections";
import { HttpError } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/queries/audit";
import { slugify } from "@/lib/utils";
import { catalogSchemas, type CatalogKind } from "@/lib/validations/catalog";
import { idSchema } from "@/lib/validations/common";
import type { AdminSession, NoteDoc, ProgramDoc, SemesterDoc, SubjectDoc } from "@/types";
import { computeSearchTokens } from "./notes";
import { revalidatePublic } from "./revalidate";

type Data = Record<string, unknown>;

/** Which collection holds each kind's parent, and the field that references it. */
const PARENT: Record<CatalogKind, { field: string; kind: CatalogKind } | null> = {
  universities: null,
  departments: { field: "universityId", kind: "universities" },
  programs: { field: "departmentId", kind: "departments" },
  semesters: { field: "programId", kind: "programs" },
  subjects: { field: "semesterId", kind: "semesters" },
};

/** Children that block deletion. */
const CHILDREN: Record<CatalogKind, { collection: string; field: string }[]> = {
  universities: [{ collection: COLLECTIONS.departments, field: "universityId" }],
  departments: [
    { collection: COLLECTIONS.programs, field: "departmentId" },
    { collection: COLLECTIONS.faculty, field: "departmentId" },
  ],
  programs: [{ collection: COLLECTIONS.semesters, field: "programId" }],
  semesters: [{ collection: COLLECTIONS.subjects, field: "semesterId" }],
  subjects: [{ collection: COLLECTIONS.notes, field: "subjectId" }],
};

const col = (kind: CatalogKind) => adminDb().collection(kind);

export async function listCatalog(kind: CatalogKind) {
  const snap = await col(kind).get();
  return snap.docs.map((d) => docToData<{ id: string } & Data>(d)!);
}

async function getDoc(kind: CatalogKind, id: string): Promise<Data | null> {
  const snap = await col(kind).doc(id).get();
  return snap.exists ? { ...(snap.data() as Data), id: snap.id } : null;
}

/** Copy ancestor ids from the parent so every document carries its full lineage. */
async function withLineage(kind: CatalogKind, data: Data): Promise<Data> {
  const parent = PARENT[kind];
  if (!parent) return data;
  const parentId = data[parent.field] as string | undefined;
  if (!parentId) throw new HttpError(400, `Missing ${parent.field}.`, "VALIDATION");
  const p = await getDoc(parent.kind, parentId);
  if (!p) throw new HttpError(400, `The selected parent (${parent.kind.slice(0, -1)}) doesn't exist.`, "BAD_PARENT");
  const out = { ...data };
  if (kind === "programs") out.universityId = p.universityId;
  if (kind === "semesters") {
    out.universityId = p.universityId;
    out.departmentId = p.departmentId;
  }
  if (kind === "subjects") {
    out.universityId = p.universityId;
    out.departmentId = p.departmentId;
    out.programId = p.programId;
  }
  return out;
}

async function assertUniqueSlug(kind: CatalogKind, data: Data, excludeId?: string) {
  const parent = PARENT[kind];
  let q: FirebaseFirestore.Query = col(kind).where("slug", "==", data.slug);
  if (parent) q = q.where(parent.field, "==", data[parent.field]);
  const snap = await q.limit(2).get();
  if (snap.docs.some((d) => d.id !== excludeId)) throw new HttpError(409, `Another ${kind.slice(0, -1)} with slug "${data.slug}" already exists here.`, "DUPLICATE_SLUG");
  if (kind === "subjects") {
    const codeSnap = await col(kind).where("semesterId", "==", data.semesterId).where("code", "==", data.code).limit(2).get();
    if (codeSnap.docs.some((d) => d.id !== excludeId)) throw new HttpError(409, `Subject code ${data.code} already exists in this semester.`, "DUPLICATE_CODE");
  }
}

function defaultId(kind: CatalogKind, data: Data): string {
  const parent = PARENT[kind];
  const parentId = parent ? String(data[parent.field]) : "";
  const own = kind === "subjects" ? slugify(String(data.code)) : String(data.slug || slugify(String(data.name)));
  const id = parent ? `${parentId}-${own}` : own;
  return id.slice(0, 120);
}

export async function createCatalog(session: AdminSession, kind: CatalogKind, body: Data) {
  const { id: requestedId, ...rest } = body;
  const parsed = catalogSchemas[kind].parse(rest) as Data;
  const data = await withLineage(kind, parsed);
  await assertUniqueSlug(kind, data);
  const id = requestedId ? idSchema.parse(requestedId) : defaultId(kind, data);
  const ref = col(kind).doc(id);
  await adminDb().runTransaction(async (tx) => {
    if ((await tx.get(ref)).exists) throw new HttpError(409, `An entry with id "${id}" already exists.`, "EXISTS");
    tx.create(ref, { ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  });
  await writeAuditLog(session, "catalog.create", kind, id, { name: data.name });
  revalidatePublic();
  return docToData<{ id: string } & Data>(await ref.get())!;
}

export async function updateCatalog(session: AdminSession, kind: CatalogKind, id: string, body: Data) {
  const current = await getDoc(kind, id);
  if (!current) throw new HttpError(404, "Not found.", "NOT_FOUND");
  const { id: _ignored, createdAt: _c, updatedAt: _u, ...rest } = body;
  void _ignored;
  void _c;
  void _u;
  // Validate the merged result against the full schema so partial updates can't produce an invalid doc.
  const { createdAt: _cc, updatedAt: _uu, id: _id, ...currentFields } = current;
  void _cc;
  void _uu;
  void _id;
  const merged = catalogSchemas[kind].parse({ ...currentFields, ...rest }) as Data;
  const data = await withLineage(kind, merged);
  if (PARENT[kind] && data[PARENT[kind]!.field] !== current[PARENT[kind]!.field]) {
    const blocking = await countChildren(kind, id);
    if (Object.values(blocking).some((n) => n > 0)) throw new HttpError(409, "Move or delete this entry's children before changing its parent.", "HAS_CHILDREN", blocking);
  }
  await assertUniqueSlug(kind, data, id);
  if (kind === "subjects") await assertUnitsNotInUse(id, current, data);
  await col(kind).doc(id).update({ ...data, updatedAt: FieldValue.serverTimestamp() });
  const synced = await syncDenormalised(kind, id);
  await writeAuditLog(session, "catalog.update", kind, id, { name: data.name, notesSynced: synced });
  revalidatePublic();
  return docToData<{ id: string } & Data>(await col(kind).doc(id).get())!;
}

/** Refuse to drop a syllabus unit while notes still reference it. */
async function assertUnitsNotInUse(subjectId: string, current: Data, next: Data) {
  const before = new Set(((current.units as { number: number }[]) ?? []).map((u) => u.number));
  const after = new Set(((next.units as { number: number }[]) ?? []).map((u) => u.number));
  const removed = [...before].filter((n) => !after.has(n));
  if (!removed.length) return;
  const snap = await adminDb().collection(COLLECTIONS.notes).where("subjectId", "==", subjectId).where("unitNumber", "in", removed.slice(0, 30)).count().get();
  const inUse = snap.data().count;
  if (inUse > 0) {
    throw new HttpError(409, `Unit ${removed.join(", ")} is still used by ${inUse} note${inUse === 1 ? "" : "s"}. Move those notes to another unit first.`, "UNIT_IN_USE", { units: removed, notes: inUse });
  }
}

async function countChildren(kind: CatalogKind, id: string): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  await Promise.all(
    CHILDREN[kind].map(async (c) => {
      const agg = await adminDb().collection(c.collection).where(c.field, "==", id).count().get();
      out[c.collection] = agg.data().count;
    }),
  );
  return out;
}

export async function deleteCatalog(session: AdminSession, kind: CatalogKind, id: string) {
  const current = await getDoc(kind, id);
  if (!current) throw new HttpError(404, "Not found.", "NOT_FOUND");
  const counts = await countChildren(kind, id);
  if (Object.values(counts).some((n) => n > 0)) {
    const parts = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${n} ${k}`);
    throw new HttpError(409, `Can't delete: still referenced by ${parts.join(", ")}.`, "HAS_CHILDREN", counts);
  }
  await col(kind).doc(id).delete();
  await writeAuditLog(session, "catalog.delete", kind, id, { name: current.name });
  revalidatePublic();
}

/**
 * Notes carry denormalised labels (subject name/code, semester number, program
 * name/slug) plus search tokens. Keep them in sync after catalogue edits.
 */
async function syncDenormalised(kind: CatalogKind, id: string): Promise<number> {
  const field = kind === "subjects" ? "subjectId" : kind === "semesters" ? "semesterId" : kind === "programs" ? "programId" : null;
  if (!field) return 0;
  const db = adminDb();
  const notes = await db.collection(COLLECTIONS.notes).where(field, "==", id).get();
  if (notes.empty) return 0;

  const cache = new Map<string, Data | null>();
  const load = async (c: CatalogKind, docId: string) => {
    const k = `${c}/${docId}`;
    if (!cache.has(k)) cache.set(k, await getDoc(c, docId));
    return cache.get(k)!;
  };

  let batch = db.batch();
  let ops = 0;
  let total = 0;
  for (const d of notes.docs) {
    const n = d.data() as NoteDoc;
    const [subject, semester, program] = (await Promise.all([load("subjects", n.subjectId), load("semesters", n.semesterId), load("programs", n.programId)])) as unknown as [
      SubjectDoc | null,
      SemesterDoc | null,
      ProgramDoc | null,
    ];
    if (!subject || !semester || !program) continue;
    const unitTitle = n.unitNumber !== null ? (subject.units?.find((u) => u.number === n.unitNumber)?.title ?? null) : null;
    const patch = {
      subjectName: subject.name,
      subjectCode: subject.code,
      semesterNumber: semester.number,
      programName: program.name,
      programSlug: program.slug,
      unitTitle,
    };
    batch.update(d.ref, {
      ...patch,
      searchTokens: computeSearchTokens({ ...n, ...patch, programShortName: program.shortName }),
    });
    ops++;
    total++;
    if (ops === 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops) await batch.commit();
  return total;
}

export function parseKind(kind: string): CatalogKind {
  if (!(["universities", "departments", "programs", "semesters", "subjects"] as const).includes(kind as CatalogKind)) {
    throw new HttpError(404, "Unknown catalogue type.", "NOT_FOUND");
  }
  return kind as CatalogKind;
}
