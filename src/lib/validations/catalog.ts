import { z } from "zod";
import { boolDefaultTrue, httpUrl, idSchema, longText, orderSchema, shortText, slugSchema } from "./common";

export const universityInput = z.object({
  name: shortText,
  shortName: z.string().trim().min(1).max(20),
  slug: slugSchema,
  city: shortText,
  state: z.string().trim().max(80).optional(),
  website: z.union([httpUrl, z.literal("")]).optional(),
  isActive: boolDefaultTrue,
});

export const departmentInput = z.object({
  universityId: idSchema,
  name: shortText,
  shortName: z.string().trim().min(1).max(30),
  slug: slugSchema,
  description: longText.optional(),
  order: orderSchema,
  isActive: boolDefaultTrue,
});

export const DEGREE_TYPES = ["B.Tech", "M.Tech", "B.Sc", "M.Sc", "BCA", "MCA", "MBA", "PhD", "Other"] as const;

export const programInput = z.object({
  universityId: idSchema,
  departmentId: idSchema,
  name: shortText,
  shortName: z.string().trim().min(1).max(40),
  slug: slugSchema,
  degreeType: z.enum(DEGREE_TYPES),
  durationYears: z.number().int().min(1).max(8),
  totalSemesters: z.number().int().min(1).max(16),
  description: longText.optional(),
  order: orderSchema,
  isActive: boolDefaultTrue,
});

export const semesterInput = z.object({
  universityId: idSchema,
  departmentId: idSchema,
  programId: idSchema,
  number: z.number().int().min(1).max(16),
  name: shortText,
  slug: slugSchema,
  isActive: boolDefaultTrue,
});

export const subjectUnitSchema = z.object({
  number: z.number().int().min(1).max(20),
  title: z.string().trim().min(1).max(160),
});

export const subjectInput = z.object({
  universityId: idSchema,
  departmentId: idSchema,
  programId: idSchema,
  semesterId: idSchema,
  code: z.string().trim().min(2).max(20).toUpperCase(),
  name: shortText,
  slug: slugSchema,
  credits: z.number().min(0).max(30).nullable().optional(),
  description: longText.optional(),
  units: z.array(subjectUnitSchema).max(20).default([]),
  order: orderSchema,
  isActive: boolDefaultTrue,
});

export type UniversityInput = z.infer<typeof universityInput>;
export type DepartmentInput = z.infer<typeof departmentInput>;
export type ProgramInput = z.infer<typeof programInput>;
export type SemesterInput = z.infer<typeof semesterInput>;
export type SubjectInput = z.infer<typeof subjectInput>;

export const CATALOG_KINDS = ["universities", "departments", "programs", "semesters", "subjects"] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];

export const catalogSchemas: Record<CatalogKind, z.ZodTypeAny> = {
  universities: universityInput,
  departments: departmentInput,
  programs: programInput,
  semesters: semesterInput,
  subjects: subjectInput,
};
