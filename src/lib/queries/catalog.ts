import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { docToData } from "@/lib/firebase/serialize";
import { COLLECTIONS } from "@/constants/collections";
import type { Department, DepartmentDoc, Program, ProgramDoc, Semester, SemesterDoc, Subject, SubjectDoc, University, UniversityDoc } from "@/types";

interface Opts {
  /** Admin views pass true to include inactive records. */
  includeInactive?: boolean;
}

function activeFilter<T extends FirebaseFirestore.Query>(q: T, opts?: Opts): FirebaseFirestore.Query {
  return opts?.includeInactive ? q : q.where("isActive", "==", true);
}

// ── Universities ────────────────────────────────────────────────
export async function getUniversities(opts?: Opts): Promise<University[]> {
  // Sorted in memory: equality + orderBy on another field would need a composite index.
  const snap = await activeFilter(adminDb().collection(COLLECTIONS.universities), opts).get();
  return snap.docs.map((d) => docToData<UniversityDoc>(d)!).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getUniversity(id: string): Promise<University | null> {
  const snap = await adminDb().collection(COLLECTIONS.universities).doc(id).get();
  return docToData<UniversityDoc>(snap);
}

// ── Departments ─────────────────────────────────────────────────
export async function getDepartments(universityId?: string, opts?: Opts): Promise<Department[]> {
  let q: FirebaseFirestore.Query = adminDb().collection(COLLECTIONS.departments);
  if (universityId) q = q.where("universityId", "==", universityId);
  q = activeFilter(q, opts);
  const snap = await q.get();
  return snap.docs
    .map((d) => docToData<DepartmentDoc>(d)!)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function getDepartment(id: string): Promise<Department | null> {
  const snap = await adminDb().collection(COLLECTIONS.departments).doc(id).get();
  return docToData<DepartmentDoc>(snap);
}

// ── Programs ────────────────────────────────────────────────────
export async function getPrograms(filter?: { universityId?: string; departmentId?: string }, opts?: Opts): Promise<Program[]> {
  let q: FirebaseFirestore.Query = adminDb().collection(COLLECTIONS.programs);
  if (filter?.universityId) q = q.where("universityId", "==", filter.universityId);
  if (filter?.departmentId) q = q.where("departmentId", "==", filter.departmentId);
  q = activeFilter(q, opts);
  const snap = await q.get();
  return snap.docs
    .map((d) => docToData<ProgramDoc>(d)!)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function getProgram(id: string): Promise<Program | null> {
  const snap = await adminDb().collection(COLLECTIONS.programs).doc(id).get();
  return docToData<ProgramDoc>(snap);
}

/** Resolve by document id first, then by slug. */
export async function getProgramByIdOrSlug(idOrSlug: string, opts?: Opts): Promise<Program | null> {
  const byId = await getProgram(idOrSlug);
  if (byId && (opts?.includeInactive || byId.isActive)) return byId;
  const snap = await activeFilter(adminDb().collection(COLLECTIONS.programs).where("slug", "==", idOrSlug), opts).limit(1).get();
  return snap.empty ? null : docToData<ProgramDoc>(snap.docs[0]);
}

// ── Semesters ───────────────────────────────────────────────────
export async function getSemesters(programId: string, opts?: Opts): Promise<Semester[]> {
  const snap = await activeFilter(adminDb().collection(COLLECTIONS.semesters).where("programId", "==", programId), opts).get();
  return snap.docs.map((d) => docToData<SemesterDoc>(d)!).sort((a, b) => a.number - b.number);
}

export async function getSemester(id: string): Promise<Semester | null> {
  const snap = await adminDb().collection(COLLECTIONS.semesters).doc(id).get();
  return docToData<SemesterDoc>(snap);
}

export async function getAllSemesters(opts?: Opts): Promise<Semester[]> {
  const snap = await activeFilter(adminDb().collection(COLLECTIONS.semesters), opts).get();
  return snap.docs.map((d) => docToData<SemesterDoc>(d)!).sort((a, b) => a.number - b.number);
}

// ── Subjects ────────────────────────────────────────────────────
export async function getSubjects(semesterId: string, opts?: Opts): Promise<Subject[]> {
  const snap = await activeFilter(adminDb().collection(COLLECTIONS.subjects).where("semesterId", "==", semesterId), opts).get();
  return snap.docs
    .map((d) => docToData<SubjectDoc>(d)!)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function getSubjectsByProgram(programId: string, opts?: Opts): Promise<Subject[]> {
  const snap = await activeFilter(adminDb().collection(COLLECTIONS.subjects).where("programId", "==", programId), opts).get();
  return snap.docs
    .map((d) => docToData<SubjectDoc>(d)!)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function getAllSubjects(opts?: Opts): Promise<Subject[]> {
  const snap = await activeFilter(adminDb().collection(COLLECTIONS.subjects), opts).get();
  return snap.docs
    .map((d) => docToData<SubjectDoc>(d)!)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function getSubject(id: string): Promise<Subject | null> {
  const snap = await adminDb().collection(COLLECTIONS.subjects).doc(id).get();
  return docToData<SubjectDoc>(snap);
}

// ── Composite helpers ───────────────────────────────────────────
export interface SubjectContext {
  subject: Subject;
  semester: Semester | null;
  program: Program | null;
  department: Department | null;
  university: University | null;
}

/** True when the subject and every ancestor exist and are active (public visibility). */
export function isPubliclyVisible(ctx: SubjectContext): boolean {
  return Boolean(ctx.subject.isActive && ctx.semester?.isActive && ctx.program?.isActive && (ctx.department?.isActive ?? true) && (ctx.university?.isActive ?? true));
}

/** Subject + its ancestors in one call (4 parallel point reads). */
export async function getSubjectContext(subjectId: string): Promise<SubjectContext | null> {
  const subject = await getSubject(subjectId);
  if (!subject) return null;
  const [semester, program, department, university] = await Promise.all([
    getSemester(subject.semesterId),
    getProgram(subject.programId),
    getDepartment(subject.departmentId),
    getUniversity(subject.universityId),
  ]);
  return { subject, semester, program, department, university };
}

export interface CatalogTree {
  programs: Program[];
  semesters: Semester[];
  subjects: Subject[];
  departments: Department[];
  universities: University[];
}

/** Everything needed to populate cascading dropdowns (admin upload form, filters). */
export async function getCatalogTree(opts?: Opts): Promise<CatalogTree> {
  const [universities, departments, programs, semesters, subjects] = await Promise.all([
    getUniversities(opts),
    getDepartments(undefined, opts),
    getPrograms(undefined, opts),
    getAllSemesters(opts),
    getAllSubjects(opts),
  ]);
  if (opts?.includeInactive) return { universities, departments, programs, semesters, subjects };
  // Public view: hiding a parent hides its whole subtree.
  const uni = new Set(universities.map((u) => u.id));
  const depts = departments.filter((d) => uni.has(d.universityId));
  const deptIds = new Set(depts.map((d) => d.id));
  const progs = programs.filter((p) => deptIds.has(p.departmentId));
  const progIds = new Set(progs.map((p) => p.id));
  const sems = semesters.filter((s) => progIds.has(s.programId));
  const semIds = new Set(sems.map((s) => s.id));
  return { universities, departments: depts, programs: progs, semesters: sems, subjects: subjects.filter((s) => semIds.has(s.semesterId)) };
}

export const EMPTY_CATALOG: CatalogTree = { programs: [], semesters: [], subjects: [], departments: [], universities: [] };
