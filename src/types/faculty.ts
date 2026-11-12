import type { Serialized, Timestamps } from "./common";

export interface FacultyDoc extends Timestamps {
  id: string;
  universityId: string;
  departmentId: string;
  name: string;
  designation: string;
  /** Display label, e.g. "Robotics & AI". */
  departmentLabel: string;
  email: string | null;
  phone: string | null;
  officeLocation: string | null;
  profileUrl: string | null;
  imageUrl: string | null;
  specializations: string[];
  bio: string | null;
  /** Admin has confirmed these details against an official source. */
  isVerified: boolean;
  /** Show on homepage strip. */
  isFeatured: boolean;
  order: number;
  isActive: boolean;
}

export type Faculty = Serialized<FacultyDoc>;
