import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Layers } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { countPublishedBySubject, getProgram, getSemester, getSemesters, getSubjects, tryQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

const loadSemester = cache((id: string) => tryQuery(() => getSemester(id), null));

export async function generateMetadata(props: { params: Promise<{ semesterId: string }> }): Promise<Metadata> {
  const { semesterId } = await props.params;
  const s = await loadSemester(semesterId);
  return s ? { title: s.name, description: `Subjects and resources for ${s.name}.` } : { title: "Semester not found" };
}

export default async function SemesterPage(props: { params: Promise<{ semesterId: string }> }) {
  const { semesterId } = await props.params;
  const semester = await loadSemester(semesterId);
  if (!semester || !semester.isActive) notFound();

  const [program, subjects, siblings] = await Promise.all([
    tryQuery(() => getProgram(semester.programId), null),
    tryQuery(() => getSubjects(semester.id), []),
    tryQuery(() => getSemesters(semester.programId), []),
  ]);
  // Hidden program ⇒ its semesters are hidden too.
  if (!program || !program.isActive) notFound();
  const counts = await tryQuery(() => countPublishedBySubject(subjects.map((s) => s.id)), {} as Record<string, number>);
  const idx = siblings.findIndex((s) => s.id === semester.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return (
    <>
      <PageHeader
        eyebrow={program?.name ?? "Semester"}
        title={semester.name}
        description="Choose a subject to see its syllabus units and every published resource."
        crumbs={[{ label: "Programs", href: "/programs" }, ...(program ? [{ label: program.shortName, href: `/programs/${program.id}` }] : []), { label: semester.name }]}
      />
      <Container className="py-10 sm:py-14">
        {subjects.length === 0 ? (
          <EmptyState icon={<BookOpen className="h-6 w-6" aria-hidden />} title="No subjects yet" description="Subjects for this semester will appear once an administrator adds them." />
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((s) => {
              const count = counts[s.id] ?? 0;
              return (
                <li key={s.id}>
                  <Link href={`/subjects/${s.id}`} className="group card-surface card-hover flex h-full flex-col p-5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="primary">{s.code}</Badge>
                      {s.credits != null && <span className="text-xs text-text-3">{s.credits} credits</span>}
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-text">{s.name}</h2>
                    {s.description && <p className="mt-1 line-clamp-2 text-sm text-text-3">{s.description}</p>}
                    <div className="mt-auto flex items-center justify-between pt-4 text-sm text-text-3">
                      <span className="flex gap-4">
                        <span className="inline-flex items-center gap-1.5">
                          <Layers className="h-4 w-4" aria-hidden />
                          {s.units.length} unit{s.units.length === 1 ? "" : "s"}
                        </span>
                        {count > 0 && <span>{count} resource{count === 1 ? "" : "s"}</span>}
                      </span>
                      <ArrowRight className="h-5 w-5 transition-all group-hover:translate-x-1 group-hover:text-lavender" aria-hidden />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <nav aria-label="Semester navigation" className="mt-10 flex flex-wrap justify-between gap-3">
          {prev ? (
            <Button href={`/semesters/${prev.id}`} variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
              {prev.name}
            </Button>
          ) : (
            <span />
          )}
          {next && (
            <Button href={`/semesters/${next.id}`} variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}>
              {next.name}
            </Button>
          )}
        </nav>
      </Container>
    </>
  );
}
