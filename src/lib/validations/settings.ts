import { z } from "zod";
import { HARD_MAX_UPLOAD_MB } from "@/constants/upload";
import { httpUrl, optionalEmail, optionalImageRef, shortText } from "./common";

export const siteSettingsInput = z.object({
  siteName: shortText,
  tagline: shortText,
  contactEmail: optionalEmail,
  maxUploadMb: z.number().min(1).max(HARD_MAX_UPLOAD_MB),
  allowedMimeTypes: z.array(z.string()).default(["application/pdf"]),
  heroImageUrl: optionalImageRef,
  defaultProgramId: z.string().trim().max(128).nullable().optional(),
  announcementBanner: z.string().trim().max(240).nullable().optional(),
  socialLinks: z.array(z.object({ label: shortText, url: httpUrl })).max(10).default([]),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsInput>;
