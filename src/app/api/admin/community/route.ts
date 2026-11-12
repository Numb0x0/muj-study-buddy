import { json, withAdmin } from "@/lib/auth/require-admin";
import { communityService } from "@/lib/services/content";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async () => json({ items: await communityService.list() }));
export const POST = withAdmin(async (req, { session }) => json({ item: await communityService.create(session, await req.json()) }, { status: 201 }));
