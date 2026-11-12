/**
 * Small helpers for the catalogue hierarchy used by admin forms/filters:
 * Program → Semester → Subject → Unit.
 */
import type { CatalogTree } from "@/lib/queries/catalog";
import type { Program, Semester, Subject, SubjectUnit } from "@/types";

export type CatalogTreeData = Pick<CatalogTree, "programs" | "semesters" | "subjects" | "departments" | "universities">;

export const semestersOf = (tree: CatalogTreeData, programId: string): Semester[] =>
  programId ? tree.semesters.filter((s) => s.programId === programId).sort((a, b) => a.number - b.number) : [];

export const subjectsOf = (tree: CatalogTreeData, semesterId: string): Subject[] =>
  semesterId ? tree.subjects.filter((s) => s.semesterId === semesterId).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)) : [];

export const unitsOf = (tree: CatalogTreeData, subjectId: string): SubjectUnit[] =>
  (tree.subjects.find((s) => s.id === subjectId)?.units ?? []).slice().sort((a, b) => a.number - b.number);

export const programLabel = (p: Program) => (p.shortName && p.shortName !== p.name ? `${p.name} (${p.shortName})` : p.name);
export const semesterLabel = (s: Semester) => s.name || `Semester ${s.number}`;
export const subjectLabel = (s: Subject) => (s.code ? `${s.code} — ${s.name}` : s.name);
