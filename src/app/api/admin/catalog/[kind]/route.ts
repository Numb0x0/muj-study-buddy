import { json, withAdmin } from "@/lib/auth/require-admin";
import { createCatalog, listCatalog, parseKind } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

export const GET = withAdmin<{ kind: string }>(async (_req, { params }) => json({ items: await listCatalog(parseKind(params.kind)) }));

export const POST = withAdmin<{ kind: string }>(async (req, { params, session }) => {
  const item = await createCatalog(session, parseKind(params.kind), await req.json());
  return json({ item }, { status: 201 });
});
