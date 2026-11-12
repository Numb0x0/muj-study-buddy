import type { Serialized, Timestamps } from "./common";

export interface SemesterDoc extends Timestamps {
  id: string;
  universityId: string;
  departmentId: string;
  programId: string;
  /** 1-based semester number. */
  number: number;
  /** Display name, e.g. "Semester 5". */
  name: string;
  slug: string;
  isActive: boolean;
}

export type Semester = Serialized<SemesterDoc>;
