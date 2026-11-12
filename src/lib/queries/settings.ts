import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { serialize } from "@/lib/firebase/serialize";
import { COLLECTIONS } from "@/constants/collections";
import { SITE } from "@/constants/site";
import { DEFAULT_MAX_UPLOAD_MB } from "@/constants/upload";
import { SITE_SETTINGS_DOC_ID, type SiteSettings, type SiteSettingsDoc } from "@/types/settings";

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: SITE.name,
  tagline: SITE.tagline,
  contactEmail: SITE.contactEmail,
  maxUploadMb: DEFAULT_MAX_UPLOAD_MB,
  allowedMimeTypes: ["application/pdf"],
  heroImageUrl: null,
  defaultProgramId: null,
  announcementBanner: null,
  socialLinks: [],
};

/** Site settings merged over defaults, so missing fields never break the UI. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const snap = await adminDb().collection(COLLECTIONS.siteSettings).doc(SITE_SETTINGS_DOC_ID).get();
  if (!snap.exists) return DEFAULT_SITE_SETTINGS;
  const data = serialize(snap.data() as Partial<SiteSettingsDoc>);
  return { ...DEFAULT_SITE_SETTINGS, ...data } as SiteSettings;
}
