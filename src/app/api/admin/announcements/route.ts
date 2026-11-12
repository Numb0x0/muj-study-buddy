import { json, withAdmin } from "@/lib/auth/require-admin";
import { announcementService } from "@/lib/services/content";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async () => json({ items: await announcementService.list() }));
export const POST = withAdmin(async (req, { session }) => json({ item: await announcementService.create(session, await req.json()) }, { status: 201 }));
