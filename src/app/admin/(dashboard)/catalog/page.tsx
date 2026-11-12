import { requireAdminPage } from "@/lib/auth/guard";
import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CatalogManager } from "@/components/admin/catalog/CatalogManager";
import { safeLoad } from "@/components/admin/server/safe-load";
import { Alert } from "@/components/ui/Feedback";
import { EMPTY_CATALOG, getCatalogTree } from "@/lib/queries";
import { CATALOG_KINDS, type CatalogKind } from "@/lib/validations/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Catalogue" };

export default async function CatalogPage(props: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdminPage();
  const { tab } = await props.searchParams;
  const active: CatalogKind = (CATALOG_KINDS as readonly string[]).includes(tab ?? "") ? (tab as CatalogKind) : "programs";
  const tree = await safeLoad(() => getCatalogTree({ includeInactive: true }), EMPTY_CATALOG);
  const placeholders = tree.data.subjects.filter((s) => s.code.startsWith("PLACEHOLDER")).length;
  return (
    <>
      <AdminPageHeader title="Academic catalogue" description="Universities → departments → programs → semesters → subjects. Everything students browse comes from here." />
      {tree.error && <Alert variant="danger" className="mb-6">{tree.error}</Alert>}
      {placeholders > 0 && (
        <Alert variant="warning" title="Placeholder subjects present" className="mb-6">
          {placeholders} subject{placeholders === 1 ? " was" : "s were"} created by the seed script as placeholders. Replace them with the official syllabus (Subjects tab), then delete the placeholders.
        </Alert>
      )}
      <CatalogManager tree={tree.data} tab={active} />
    </>
  );
}
