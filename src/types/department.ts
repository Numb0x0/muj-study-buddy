import type { Serialized, Timestamps } from "./common";

export interface DepartmentDoc extends Timestamps {
  id: string;
  universityId: string;
  name: string;
  shortName: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
}

export type Department = Serialized<DepartmentDoc>;
