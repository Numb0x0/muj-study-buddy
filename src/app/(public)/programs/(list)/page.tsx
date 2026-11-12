import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarRange, GraduationCap, Layers } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { CardIcon } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SetupHint } from "@/components/programs/SetupHint";
import { getDepartments, getPrograms, tryQuery } from "@/lib/queries";
import type { Program } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Degree Programs", description: "Browse degree programs, semesters and subjects at MUJ." };

export default async function ProgramsPage() {
  const [departments, programs] = await Promise.all([tryQuery(() => getDepartments(), []), tryQuery(() => getPrograms(), [])]);

  const groups = departments
    .map((d) => ({ department: d, programs: programs.filter((p) => p.departmentId === d.id) }))
    .filter((g) => g.programs.length > 0);
  const orphans = programs.filter((p) => !departments.some((d) => d.id === p.departmentId));

  return (
    <>
      <PageHeader
        eyebrow="Browse by program"
        title="Degree Programs"
        description="Pick your program to see its semesters, subjects and every published resource."
        crumbs={[{ label: "Programs" }]}
      />
      <Container className="py-10 sm:py-14">
        {programs.length === 0 ? (
          <>
            <EmptyState icon={<GraduationCap className="h-6 w-6" aria-hidden />} title="No programs yet" description="Administrators can add departments and programs from the catalogue manager." />
            <SetupHint />
          </>
        ) : (
          <div className="space-y-12">
            {groups.map((g) => (
              <section key={g.department.id} aria-labelledby={`dept-${g.department.id}`}>
                <h2 id={`dept-${g.department.id}`} className="text-xl font-bold text-text">
                  {g.department.name}
                </h2>
                {g.department.description && <p className="mt-1 max-w-2xl text-sm text-text-3">{g.department.description}</p>}
                <ProgramGrid programs={g.programs} />
              </section>
            ))}
            {orphans.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-text">Other programs</h2>
                <ProgramGrid programs={orphans} />
              </section>
            )}
          </div>
        )}
      </Container>
    </>
  );
}

function ProgramGrid({ programs }: { programs: Program[] }) {
  return (
    <ul className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {programs.map((p) => (
        <li key={p.id}>
          <Link href={`/programs/${p.id}`} className="group card-surface card-hover relative flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <CardIcon>
                <GraduationCap className="h-6 w-6" aria-hidden />
              </CardIcon>
              <Badge variant="primary">{p.degreeType}</Badge>
            </div>
            <h3 className="mt-5 text-lg font-bold text-text">{p.name}</h3>
            {p.description && <p className="mt-2 line-clamp-3 text-sm text-text-3">{p.description}</p>}
            <div className="mt-auto flex items-center justify-between pt-5 text-sm text-text-2">
              <span className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarRange className="h-4 w-4 text-text-3" aria-hidden />
                  {p.durationYears} years
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-text-3" aria-hidden />
                  {p.totalSemesters} semesters
                </span>
              </span>
              <ArrowRight className="h-5 w-5 text-text-3 transition-all group-hover:translate-x-1 group-hover:text-lavender" aria-hidden />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
