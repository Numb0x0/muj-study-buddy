import { json, withAdmin } from "@/lib/auth/require-admin";
import { facultyService } from "@/lib/services/content";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async () => json({ items: await facultyService.list() }));
export const POST = withAdmin(async (req, { session }) => json({ item: await facultyService.create(session, await req.json()) }, { status: 201 }));
