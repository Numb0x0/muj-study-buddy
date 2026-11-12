import { z } from "zod";
import { BUNDLED_IMAGE_PATH } from "@/constants/images";

export const idSchema = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/, "Invalid id");
export const slugSchema = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");
export const shortText = z.string().trim().min(1).max(160);
export const longText = z.string().trim().max(4000);
/** http(s) only — blocks javascript:, data: and other schemes in admin-entered links. */
export const httpUrl = z.url({ protocol: /^https?$/, error: "Must be an http(s) URL." });
export const optionalUrl = z.union([httpUrl, z.literal("")]).transform((v) => (v === "" ? null : v)).nullable().optional();
/** An http(s) URL, or a path to an image bundled in public/images (no uploads on the Spark plan). */
export const optionalImageRef = z
  .union([httpUrl, z.string().trim().regex(BUNDLED_IMAGE_PATH, "Pick a bundled image or enter an http(s) URL."), z.literal("")])
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();
export const optionalEmail = z.union([z.email(), z.literal("")]).transform((v) => (v === "" ? null : v)).nullable().optional();
export const boolDefaultTrue = z.boolean().default(true);
export const orderSchema = z.number().int().min(0).max(10_000).default(0);

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(12),
  /** Opaque base64url cursor from a previous page. */
  cursor: z.string().trim().max(300).regex(/^[A-Za-z0-9_-]+$/, "Invalid cursor").optional(),
});

export type Pagination = z.infer<typeof paginationSchema>;
