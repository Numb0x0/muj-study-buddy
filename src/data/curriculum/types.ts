/**
 * Official curriculum data (static, versioned in the repo).
 *
 * Source of truth for codes, names and L-T-P-C is each batch's SCHEME
 * document. Syllabus entries (topics + references) are attached by key; where
 * the syllabus prints a different code the scheme code is shown and the
 * difference is recorded in `notes` / docs/CURRICULUM.md.
 */

export type BatchId = "2025" | "2024";

export interface SyllabusEntry {
  /** Code as printed in the SYLLABUS document (may differ from the scheme). */
  code: string;
  title: string;
  /** [L, T, P, C] as printed in the syllabus. */
  ltpc: [number, number, number, number];
  /** Semester heading the entry appeared under, if any. */
  section: string | null;
  topics: string;
  references: string[];
}

export type CourseKind = "theory" | "lab" | "project" | "internship" | "program-elective" | "open-elective" | "flexi-core" | "honours-minor";

export interface SchemeCourse {
  /** Code as printed in the scheme (placeholders like RAIXXXX kept as-is). */
  code: string;
  name: string;
  l: number;
  t: number;
  p: number;
  c: number;
  kind: CourseKind;
  /** Syllabus entry key(s) for this course in the batch's syllabus. */
  syllabus?: string[];
  /** Elective / flexi-core slot → id of its option group. */
  group?: string;
  /** Short factual note shown under the course (e.g. a code mismatch). */
  note?: string;
}

export interface SchemeSemester {
  number: number;
  courses: SchemeCourse[];
  /** Semester credit total as printed in the scheme. */
  totalCredits: number;
}

export interface CourseOption {
  code: string;
  name: string;
  syllabus?: string[];
  note?: string;
}

export interface OptionGroup {
  /** e.g. "pe1", "fc2" */
  id: string;
  /** e.g. "Program Elective 1" */
  label: string;
  semester: number;
  options: CourseOption[];
  note?: string;
}

export interface ExtraTrack {
  id: string;
  title: string;
  credits: string;
  /** Courses added on top of the regular scheme, per semester. */
  additions: { semester: number; courses: SchemeCourse[] }[];
  electives?: { title: string; options: CourseOption[] }[];
  notes?: string[];
}

export interface BatchCurriculum {
  id: BatchId;
  /** Toggle label, e.g. "2025 onwards". */
  label: string;
  title: string;
  description: string;
  totalCredits: number;
  /** Catalogue program these subjects are seeded into. */
  programId: string;
  sources: { scheme: string; syllabus: string };
  semesters: SchemeSemester[];
  /** Why some semesters are absent, if any are. */
  coverageNote?: string;
  groups: OptionGroup[];
  openElectives: CourseOption[];
  tracks: ExtraTrack[];
  syllabus: Record<string, SyllabusEntry>;
  /** Known inconsistencies between this batch's scheme and syllabus documents. */
  notes: string[];
}
