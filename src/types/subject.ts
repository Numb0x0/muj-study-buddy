import type { Serialized, Timestamps } from "./common";

export interface SubjectUnit {
  number: number;
  title: string;
}

export interface SubjectDoc extends Timestamps {
  id: string;
  universityId: string;
  departmentId: string;
  programId: string;
  semesterId: string;
  /** Official course code, e.g. "MCE3152". */
  code: string;
  name: string;
  slug: string;
  credits?: number | null;
  description?: string;
  /** Syllabus units; notes reference a unit by number. */
  units: SubjectUnit[];
  order: number;
  isActive: boolean;
}

export type Subject = Serialized<SubjectDoc>;
