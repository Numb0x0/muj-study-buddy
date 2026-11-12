import { z } from "zod";
import { json, withAdmin } from "@/lib/auth/require-admin";
import { listAuditLogs } from "@/lib/queries/audit";
import { idSchema } from "@/lib/validations/common";

export const dynamic = "force-dynamic";

const q = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50), targetId: idSchema.optional() });

export const GET = withAdmin(async (req) => {
  const sp = req.nextUrl.searchParams;
  const input = q.parse({ limit: sp.get("limit") ?? undefined, targetId: sp.get("targetId") || undefined });
  return json({ items: await listAuditLogs(input) });
});
