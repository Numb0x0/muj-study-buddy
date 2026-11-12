import type { Serialized, Timestamps } from "./common";

export interface SiteSettingsDoc extends Partial<Timestamps> {
  siteName: string;
  tagline: string;
  contactEmail: string | null;
  /** Upload ceiling in MB; mirrored in storage.rules. */
  maxUploadMb: number;
  allowedMimeTypes: string[];
  heroImageUrl: string | null;
  /** Program highlighted on the homepage. */
  defaultProgramId: string | null;
  /** Short banner shown at the top of every public page, or null. */
  announcementBanner: string | null;
  socialLinks: { label: string; url: string }[];
}

export type SiteSettings = Serialized<SiteSettingsDoc>;

export const SITE_SETTINGS_DOC_ID = "general";
