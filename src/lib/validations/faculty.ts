import { z } from "zod";
import { boolDefaultTrue, idSchema, longText, optionalEmail, optionalImageRef, optionalUrl, orderSchema, shortText } from "./common";

export const facultyInput = z.object({
  universityId: idSchema,
  departmentId: idSchema,
  name: shortText,
  designation: shortText,
  departmentLabel: shortText,
  email: optionalEmail,
  phone: z
    .union([z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Invalid phone"), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  officeLocation: z.string().trim().max(160).nullable().optional(),
  profileUrl: optionalUrl,
  imageUrl: optionalImageRef,
  specializations: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  bio: longText.nullable().optional(),
  isVerified: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  order: orderSchema,
  isActive: boolDefaultTrue,
});
export type FacultyInput = z.infer<typeof facultyInput>;
