import { json, withAdmin } from "@/lib/auth/require-admin";
import { publishNote } from "@/lib/services/notes";
import { idSchema } from "@/lib/validations/common";

export const dynamic = "force-dynamic";

export const POST = withAdmin<{ id: string }>(async (_req, { params, session }) => json({ note: await publishNote(session, idSchema.parse(params.id)) }));
