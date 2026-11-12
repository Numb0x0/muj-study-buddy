import { z } from "zod";
import { COMMUNITY_ITEM_TYPES } from "@/types/community";
import { boolDefaultTrue, longText, optionalUrl, orderSchema, shortText } from "./common";

export const communityItemInput = z.object({
  type: z.enum(COMMUNITY_ITEM_TYPES),
  title: shortText,
  description: longText,
  url: optionalUrl,
  eventDate: z.union([z.iso.datetime(), z.iso.date(), z.literal("")]).transform((v) => (v === "" ? null : v)).nullable().optional(),
  location: z.string().trim().max(160).nullable().optional(),
  order: orderSchema,
  isActive: boolDefaultTrue,
});
export type CommunityItemInput = z.infer<typeof communityItemInput>;

export const announcementInput = z.object({
  title: shortText,
  body: longText,
  url: optionalUrl,
  isPinned: z.boolean().default(false),
  isActive: boolDefaultTrue,
});
export type AnnouncementInput = z.infer<typeof announcementInput>;
