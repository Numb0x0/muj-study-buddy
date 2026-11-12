import type { Serialized, Timestamps } from "./common";

export interface UniversityDoc extends Timestamps {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  city: string;
  state?: string;
  website?: string;
  isActive: boolean;
}

export type University = Serialized<UniversityDoc>;
