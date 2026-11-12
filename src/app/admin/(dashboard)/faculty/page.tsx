import { requireAdminPage } from "@/lib/auth/guard";
import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FacultyManager } from "@/components/admin/faculty/FacultyManager";
import { safeLoad } from "@/components/admin/server/safe-load";
import { Alert } from "@/components/ui/Feedback";
import { getDepartments, getFacultyList, getUniversities } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Faculty" };

export default async function AdminFacultyPage() {
  await requireAdminPage();
  const [faculty, departments, universities] = await Promise.all([
    safeLoad(() => getFacultyList({ includeInactive: true, raw: true }), []),
    safeLoad(() => getDepartments(undefined, { includeInactive: true }), []),
    safeLoad(() => getUniversities({ includeInactive: true }), []),
  ]);
  const error = faculty.error ?? departments.error ?? universities.error;
  return (
    <>
      <AdminPageHeader title="Faculty" description="Profiles shown in the faculty directory and on the homepage." />
      {error && <Alert variant="danger" className="mb-6">{error}</Alert>}
      <FacultyManager faculty={faculty.data} departments={departments.data} universities={universities.data} />
    </>
  );
}
