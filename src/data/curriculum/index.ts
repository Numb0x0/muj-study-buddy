import { BATCH_ORDER, CURRICULA, DEFAULT_BATCH } from "./schemes";
import type { BatchCurriculum, BatchId, CourseKind, SchemeCourse, SyllabusEntry } from "./types";

export type { BatchCurriculum, BatchId, CourseKind, CourseOption, ExtraTrack, OptionGroup, SchemeCourse, SchemeSemester, SyllabusEntry } from "./types";
export { BATCH_ORDER, CURRICULA, DEFAULT_BATCH };

export const isBatchId = (v: unknown): v is BatchId => v === "2025" || v === "2024";

export function getCurriculum(batch: BatchId): BatchCurriculum {
  return CURRICULA[batch];
}

/** Syllabus entries for a course, skipping keys the batch's syllabus doesn't have. */
export function syllabusFor(curriculum: BatchCurriculum, keys: string[] | undefined): SyllabusEntry[] {
  return (keys ?? []).map((k) => curriculum.syllabus[k]).filter((e): e is SyllabusEntry => Boolean(e));
}

/** Anchor id for a course on /curriculum (stable across renders). */
export function courseAnchor(batch: BatchId, semester: number | null, code: string, name: string): string {
  const slug = `${code}-${name}`.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `b${batch}${semester ? `-s${semester}` : ""}-${slug}`;
}

export const KIND_LABEL: Record<CourseKind, string> = {
  theory: "Course",
  lab: "Lab",
  project: "Project",
  internship: "Internship",
  "program-elective": "Program elective",
  "open-elective": "Open elective",
  "flexi-core": "Flexi core",
  "honours-minor": "Minor / Honours",
};

/** Slots that stand for a choice of course rather than a course. */
export const isSlot = (c: Pick<SchemeCourse, "kind">) => c.kind === "program-elective" || c.kind === "open-elective" || c.kind === "flexi-core";

// ── Catalogue seeding ───────────────────────────────────────────

export interface CatalogSubjectSeed {
  semester: number;
  code: string;
  name: string;
  credits: number;
  description: string;
  /** Unique within the semester; used for the subject document id. */
  key: string;
  order: number;
}

const ltpc = (c: { l: number; t: number; p: number; c: number }) => `L-T-P-C ${c.l}-${c.t}-${c.p}-${c.c}`;
const keyOf = (code: string, name: string) => `${code}-${name}`.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Concrete courses for the notes catalogue: every non-slot course in the
 * scheme, plus each program-elective / flexi-core option in the semester it is
 * offered. Open electives are skipped (students take them from other
 * departments' lists), as are minor/honours additions.
 */
export function catalogSubjects(curriculum: BatchCurriculum): CatalogSubjectSeed[] {
  const out: CatalogSubjectSeed[] = [];
  for (const sem of curriculum.semesters) {
    let order = 1;
    for (const c of sem.courses) {
      if (c.kind === "open-elective") continue;
      if (isSlot(c)) {
        const group = curriculum.groups.find((g) => g.id === c.group);
        for (const o of group?.options ?? []) {
          out.push({
            semester: sem.number,
            code: o.code,
            name: o.name,
            credits: c.c,
            description: `${group?.label ?? "Elective"} option, Semester ${sem.number} (${ltpc(c)}) — ${curriculum.label} scheme.`,
            key: keyOf(o.code, o.name),
            order: order++,
          });
        }
        continue;
      }
      out.push({
        semester: sem.number,
        code: c.code,
        name: c.name,
        credits: c.c,
        description: `${KIND_LABEL[c.kind]}, Semester ${sem.number} (${ltpc(c)}) — ${curriculum.label} scheme.`,
        key: keyOf(c.code, c.name),
        order: order++,
      });
    }
  }
  return out;
}

/**
 * Find the curriculum course behind a catalogue subject (matched by program,
 * code and name), so subject pages can show the official syllabus.
 */
export function findCurriculumCourse(programId: string, code: string, name: string): { curriculum: BatchCurriculum; semester: number; code: string; name: string; syllabus: SyllabusEntry[]; note?: string } | null {
  const curriculum = Object.values(CURRICULA).find((c) => c.programId === programId);
  if (!curriculum) return null;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const sem of curriculum.semesters) {
    for (const c of sem.courses) {
      if (!isSlot(c) && norm(c.code) === norm(code) && norm(c.name) === norm(name)) return { curriculum, semester: sem.number, code: c.code, name: c.name, syllabus: syllabusFor(curriculum, c.syllabus), note: c.note };
    }
  }
  for (const g of curriculum.groups) {
    for (const o of g.options) {
      if (norm(o.code) === norm(code) && norm(o.name) === norm(name)) return { curriculum, semester: g.semester, code: o.code, name: o.name, syllabus: syllabusFor(curriculum, o.syllabus), note: o.note };
    }
  }
  return null;
}
