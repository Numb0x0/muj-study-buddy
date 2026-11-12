import type { Serialized, Timestamps } from "./common";

export type DegreeType = "B.Tech" | "M.Tech" | "B.Sc" | "M.Sc" | "BCA" | "MCA" | "MBA" | "PhD" | "Other";

export interface ProgramDoc extends Timestamps {
  id: string;
  universityId: string;
  departmentId: string;
  name: string;
  shortName: string;
  slug: string;
  degreeType: DegreeType;
  durationYears: number;
  totalSemesters: number;
  description?: string;
  order: number;
  isActive: boolean;
}

export type Program = Serialized<ProgramDoc>;
