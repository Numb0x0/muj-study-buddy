import { json, withAdmin } from "@/lib/auth/require-admin";
import { announcementService } from "@/lib/services/content";
import { idSchema } from "@/lib/validations/common";

export const dynamic = "force-dynamic";
type P = { id: string };

export const GET = withAdmin<P>(async (_req, { params }) => json({ item: await announcementService.get(idSchema.parse(params.id)) }));
export const PATCH = withAdmin<P>(async (req, { params, session }) => json({ item: await announcementService.update(session, idSchema.parse(params.id), await req.json()) }));
export const DELETE = withAdmin<P>(async (_req, { params, session }) => {
  await announcementService.remove(session, idSchema.parse(params.id));
  return json({ ok: true });
});
