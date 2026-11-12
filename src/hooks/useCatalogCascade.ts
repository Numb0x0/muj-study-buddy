"use client";

import { useMemo } from "react";
import { unitLabel } from "@/lib/utils";
import type { SelectOption } from "@/components/ui/Input";
import type { CatalogTree } from "@/lib/queries/catalog";
import type { Department, Program, Semester, Subject, SubjectUnit } from "@/types";

/** Currently selected ids (empty string / null / undefined = nothing selected). */
export interface CatalogSelection {
  departmentId?: string | null;
  programId?: string | null;
  semesterId?: string | null;
  subjectId?: string | null;
}

export interface CatalogCascade {
  /** Departments (optionally narrowed to the selected program's department). */
  departments: Department[];
  /** Programs, narrowed by department when one is selected. */
  programs: Program[];
  /** Semesters of the selected program (empty until a program is chosen). */
  semesters: Semester[];
  /** Subjects of the selected semester (empty until a semester is chosen). */
  subjects: Subject[];
  /** Syllabus units of the selected subject. */
  units: SubjectUnit[];

  department: Department | null;
  program: Program | null;
  semester: Semester | null;
  subject: Subject | null;

  departmentOptions: SelectOption[];
  programOptions: SelectOption[];
  semesterOptions: SelectOption[];
  subjectOptions: SelectOption[];
  unitOptions: SelectOption[];
}

const norm = (v: string | null | undefined) => (v ? v : "");

/**
 * Pure derivation — usable on the server too. Given the whole catalogue tree
 * and the current selection, returns the narrowed option lists for a
 * Program → Semester → Subject → Unit cascade, plus the resolved entities.
 * A selection whose parent no longer matches (e.g. semester of another
 * program) resolves to `null`, so callers can detect and reset it.
 */
export function deriveCatalogCascade(tree: CatalogTree, selection: CatalogSelection): CatalogCascade {
  const departmentId = norm(selection.departmentId);
  const programId = norm(selection.programId);
  const semesterId = norm(selection.semesterId);
  const subjectId = norm(selection.subjectId);

  const departments = tree.departments;
  const department = departmentId ? (departments.find((d) => d.id === departmentId) ?? null) : null;

  const programs = department ? tree.programs.filter((p) => p.departmentId === department.id) : tree.programs;
  const program = programId ? (programs.find((p) => p.id === programId) ?? null) : null;

  const semesters = program ? tree.semesters.filter((s) => s.programId === program.id).sort((a, b) => a.number - b.number) : [];
  const semester = semesterId ? (semesters.find((s) => s.id === semesterId) ?? null) : null;

  const subjects = semester
    ? tree.subjects.filter((s) => s.semesterId === semester.id).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    : [];
  const subject = subjectId ? (subjects.find((s) => s.id === subjectId) ?? null) : null;

  const units = subject ? [...subject.units].sort((a, b) => a.number - b.number) : [];

  return {
    departments,
    programs,
    semesters,
    subjects,
    units,
    department,
    program,
    semester,
    subject,
    departmentOptions: departments.map((d) => ({ value: d.id, label: d.name })),
    programOptions: programs.map((p) => ({ value: p.id, label: p.name })),
    semesterOptions: semesters.map((s) => ({ value: s.id, label: s.name || `Semester ${s.number}` })),
    subjectOptions: subjects.map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` })),
    unitOptions: units.map((u) => ({ value: String(u.number), label: unitLabel(u.number, u.title) ?? `Unit ${u.number}` })),
  };
}

/**
 * Memoised cascade for client forms / filter bars.
 *
 *   const { programOptions, semesterOptions, subjectOptions, unitOptions } =
 *     useCatalogCascade(catalog, { programId, semesterId, subjectId });
 */
export function useCatalogCascade(tree: CatalogTree, selection: CatalogSelection): CatalogCascade {
  const { departmentId, programId, semesterId, subjectId } = selection;
  return useMemo(
    () => deriveCatalogCascade(tree, { departmentId, programId, semesterId, subjectId }),
    [tree, departmentId, programId, semesterId, subjectId],
  );
}
