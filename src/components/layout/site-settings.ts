import "server-only";
import { cache } from "react";
import { tryQuery } from "@/lib/queries/safe";
import { DEFAULT_SITE_SETTINGS, getSiteSettings } from "@/lib/queries/settings";
import type { SiteSettings } from "@/types/settings";

/**
 * Site settings for public pages. Wrapped in React `cache` so the public
 * layout and the page it renders share a single Firestore read per request,
 * and in `tryQuery` so a missing Firebase config falls back to defaults.
 */
export const loadSiteSettings = cache(async (): Promise<SiteSettings> => tryQuery(getSiteSettings, DEFAULT_SITE_SETTINGS));
