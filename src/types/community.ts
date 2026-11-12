import type { Serialized, Timestamps } from "./common";

export const COMMUNITY_ITEM_TYPES = ["event", "study-group", "project", "discussion", "link"] as const;
export type CommunityItemType = (typeof COMMUNITY_ITEM_TYPES)[number];

/** Curated, admin-managed community entries (no public posting in v1). */
export interface CommunityItemDoc extends Timestamps {
  id: string;
  type: CommunityItemType;
  title: string;
  description: string;
  url: string | null;
  /** ISO date for events, else null. */
  eventDate: string | null;
  location: string | null;
  order: number;
  isActive: boolean;
}
export type CommunityItem = Serialized<CommunityItemDoc>;

export interface AnnouncementDoc extends Timestamps {
  id: string;
  title: string;
  body: string;
  url: string | null;
  isPinned: boolean;
  isActive: boolean;
}
export type Announcement = Serialized<AnnouncementDoc>;
