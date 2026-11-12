import { json, withAdmin } from "@/lib/auth/require-admin";
import { getSiteSettings } from "@/lib/queries/settings";
import { updateSiteSettings } from "@/lib/services/content";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async () => json({ settings: await getSiteSettings() }));
export const PUT = withAdmin(async (req, { session }) => json({ settings: await updateSiteSettings(session, await req.json()) }));
