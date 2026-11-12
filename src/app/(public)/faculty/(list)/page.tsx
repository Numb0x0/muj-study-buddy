import type { Metadata } from "next";
import { ShieldCheck, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { FacultyDirectory } from "@/components/faculty/FacultyDirectory";
import { getDepartments, getFacultyList, getSetupStatus, tryQuery } from "@/lib/queries";
import { SITE } from "@/constants/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Faculty",
  description: `Faculty directory for the ${SITE.universityShort} Department of Mechatronics Engineering — designations, specializations and verified contact details.`,
};

interface Props {
  searchParams: Promise<{ department?: string | string[] }>;
}

export default async function FacultyPage({ searchParams }: Props) {
  const sp = await searchParams;
  const initialDepartmentId = Array.isArray(sp.department) ? sp.department[0] : sp.department;

  const [faculty, departments] = await Promise.all([
    tryQuery(() => getFacultyList(), []),
    tryQuery(() => getDepartments(), []),
  ]);
  const setup = getSetupStatus();
  const verifiedCount = faculty.filter((f) => f.isVerified).length;

  return (
    <>
      <PageHeader
        eyebrow="Faculty directory"
        title="Meet the faculty"
        description="Faculty of the Department of Mechatronics Engineering, which runs two B.Tech branches: Mechatronics, and Robotics & AI. Contact details appear only after an administrator confirms the faculty member has agreed to share them."
        crumbs={[{ label: "Faculty" }]}
      >
        {faculty.length > 0 && (
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-text-2">
            <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
            {verifiedCount} of {faculty.length} profile{faculty.length === 1 ? "" : "s"} verified
          </p>
        )}
      </PageHeader>

      <Container className="py-10 sm:py-14">
        {faculty.length === 0 ? (
          <div className="space-y-4">
            <EmptyState
              icon={<UsersRound className="h-6 w-6" aria-hidden />}
              title="No faculty profiles yet"
              description="Administrators can add verified profiles from the dashboard."
              action={
                <Button href="/contact" variant="outline" size="sm">
                  Suggest a correction or addition
                </Button>
              }
            />
            {!setup.configured && (
              <p className="text-center text-xs text-muted">
                Firebase not configured yet — copy <code className="rounded bg-white/5 px-1 py-0.5">.env.example</code> to{" "}
                <code className="rounded bg-white/5 px-1 py-0.5">.env.local</code> to load real data.
              </p>
            )}
          </div>
        ) : (
          <FacultyDirectory faculty={faculty} departments={departments} initialDepartmentId={initialDepartmentId} />
        )}
      </Container>
    </>
  );
}
