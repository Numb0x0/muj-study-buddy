import { json, withAdmin } from "@/lib/auth/require-admin";
import { deleteCatalog, parseKind, updateCatalog } from "@/lib/services/catalog";
import { idSchema } from "@/lib/validations/common";

export const dynamic = "force-dynamic";
type P = { kind: string; id: string };

export const PATCH = withAdmin<P>(async (req, { params, session }) => json({ item: await updateCatalog(session, parseKind(params.kind), idSchema.parse(params.id), await req.json()) }));

export const DELETE = withAdmin<P>(async (_req, { params, session }) => {
  await deleteCatalog(session, parseKind(params.kind), idSchema.parse(params.id));
  return json({ ok: true });
});
