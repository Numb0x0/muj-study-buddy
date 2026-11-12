import { requireAdminPage } from "@/lib/auth/guard";
import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CommunityManager } from "@/components/admin/community/CommunityManager";
import { safeLoad } from "@/components/admin/server/safe-load";
import { Alert } from "@/components/ui/Feedback";
import { getAnnouncements, getCommunityItems } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Community" };

export default async function AdminCommunityPage() {
  await requireAdminPage();
  const [ann, items] = await Promise.all([safeLoad(() => getAnnouncements({ includeInactive: true }), []), safeLoad(() => getCommunityItems({ includeInactive: true }), [])]);
  return (
    <>
      <AdminPageHeader title="Community" description="Curated announcements and community listings. There is no public posting in this version." />
      {(ann.error || items.error) && <Alert variant="danger" className="mb-6">{ann.error ?? items.error}</Alert>}
      <CommunityManager announcements={ann.data} items={items.data} />
    </>
  );
}
