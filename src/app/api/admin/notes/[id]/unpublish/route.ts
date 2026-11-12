import { json, withAdmin } from "@/lib/auth/require-admin";
import { unpublishNote } from "@/lib/services/notes";
import { idSchema } from "@/lib/validations/common";

export const dynamic = "force-dynamic";

export const POST = withAdmin<{ id: string }>(async (_req, { params, session }) => json({ note: await unpublishNote(session, idSchema.parse(params.id)) }));
