import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, FileText, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { countPublishedNotes, getDepartment, getProgramByIdOrSlug, getSemesters, getSubjectsByProgram, tryQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

const loadProgram = cache((id: string) => tryQuery(() => getProgramByIdOrSlug(id), null));

export async function generateMetadata(props: { params: Promise<{ programId: string }> }): Promise<Metadata> {
  const { programId } = await props.params;
  const program = await loadProgram(programId);
  return program ? { title: program.name, description: program.description ?? `Semesters and subjects for ${program.name}.` } : { title: "Program not found" };
}

export default async function ProgramPage(props: { params: Promise<{ programId: string }> }) {
  const { programId } = await props.params;
  const program = await loadProgram(programId);
  if (!program) notFound();

  const [department, semesters, subjects] = await Promise.all([
    tryQuery(() => getDepartment(program.departmentId), null),
    tryQuery(() => getSemesters(program.id), []),
    tryQuery(() => getSubjectsByProgram(program.id), []),
  ]);
  if (department && !department.isActive) notFound();
  const counts = await Promise.all(semesters.map((s) => tryQuery(() => countPublishedNotes({ semesterId: s.id }), 0)));

  return (
    <>
      <PageHeader
        eyebrow={department?.name ?? "Degree program"}
        title={program.name}
        description={program.description}
        crumbs={[{ label: "Programs", href: "/programs" }, { label: program.shortName }]}
        actions={
          <Button href={`/resources?programId=${program.id}`} variant="outline" leftIcon={<Search className="h-4 w-4" aria-hidden />}>
            Search this program
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">{program.degreeType}</Badge>
          <Badge>{program.durationYears} years</Badge>
          <Badge>{program.totalSemesters} semesters</Badge>
        </div>
      </PageHeader>

      <Container className="py-10 sm:py-14">
        <h2 className="mb-5 text-xl font-bold text-text">Semesters</h2>
        {semesters.length === 0 ? (
          <EmptyState title="No semesters added yet" description="Administrators can add semesters for this program from the catalogue manager." />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {semesters.map((s, i) => {
              const subjectCount = subjects.filter((sub) => sub.semesterId === s.id).length;
              const noteCount = counts[i];
              return (
                <li key={s.id}>
                  <Link href={`/semesters/${s.id}`} className="group card-surface card-hover flex h-full flex-col p-5">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-lavender">Semester</span>
                    <span className="mt-1 text-4xl font-extrabold text-text">{s.number}</span>
                    <span className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-3">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4" aria-hidden />
                        {subjectCount} subject{subjectCount === 1 ? "" : "s"}
                      </span>
                      {noteCount > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <FileText className="h-4 w-4" aria-hidden />
                          {noteCount} resource{noteCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </span>
                    <ArrowRight className="mt-4 h-5 w-5 self-end text-text-3 transition-all group-hover:translate-x-1 group-hover:text-lavender" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </>
  );
}
