import type { NextRequest } from "next/server";
import { z } from "zod";
import { json, withPublic } from "@/lib/auth/require-admin";
import { getCatalogTree, type CatalogTree } from "@/lib/queries/catalog";
import { idSchema } from "@/lib/validations/common";

export const dynamic = "force-dynamic";

const catalogQuery = z.object({ programId: idSchema.optional() });

/**
 * GET /api/catalog — active universities/departments/programs/semesters/subjects
 * for cascading dropdowns. `?programId=` narrows semesters and subjects to that program.
 */
export const GET = withPublic(async (req: NextRequest) => {
  const raw = req.nextUrl.searchParams.get("programId");
  const { programId } = catalogQuery.parse({ programId: raw && raw.trim() !== "" ? raw : undefined });

  const tree = await getCatalogTree();
  const body: CatalogTree = programId
    ? {
        ...tree,
        semesters: tree.semesters.filter((s) => s.programId === programId),
        subjects: tree.subjects.filter((s) => s.programId === programId),
      }
    : tree;

  return json(body, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
});
