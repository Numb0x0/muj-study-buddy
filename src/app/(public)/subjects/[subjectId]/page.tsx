import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { BookMarked, FileQuestion, ListOrdered, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResourceTypeIcon } from "@/components/ui/ResourceTypeIcon";
import { NoteCard } from "@/components/resources/NoteCard";
import { RESOURCE_TYPE_META } from "@/constants/resources";
import { getPublishedNotesBySubject, getSubjectContext, isPubliclyVisible, tryQuery } from "@/lib/queries";
import { RESOURCE_TYPES, type NoteSummary, type ResourceType } from "@/types";
import { unitLabel } from "@/lib/utils";
import { courseAnchor, DEFAULT_BATCH, findCurriculumCourse } from "@/data/curriculum";

export const dynamic = "force-dynamic";

const loadContext = cache((id: string) => tryQuery(() => getSubjectContext(id), null));

export async function generateMetadata(props: { params: Promise<{ subjectId: string }> }): Promise<Metadata> {
  const { subjectId } = await props.params;
  const ctx = await loadContext(subjectId);
  return ctx && isPubliclyVisible(ctx) ? { title: `${ctx.subject.code} ${ctx.subject.name}`, description: ctx.subject.description ?? `Notes, PYQs and lab resources for ${ctx.subject.name}.` } : { title: "Subject not found" };
}

export default async function SubjectPage(props: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await props.params;
  const ctx = await loadContext(subjectId);
  if (!ctx || !isPubliclyVisible(ctx)) notFound();
  const { subject, semester, program } = ctx;

  const notes = await tryQuery(() => getPublishedNotesBySubject(subject.id), []);
  const byType = new Map<ResourceType, NoteSummary[]>();
  for (const n of notes) byType.set(n.resourceType, [...(byType.get(n.resourceType) ?? []), n]);
  const sections = RESOURCE_TYPES.filter((t) => byType.has(t));
  // Official scheme/syllabus entry for this course, when the subject came from the curriculum.
  const official = findCurriculumCourse(subject.programId, subject.code, subject.name);
  const officialHref = official
    ? `/curriculum${official.curriculum.id === DEFAULT_BATCH ? "" : `?batch=${official.curriculum.id}`}#${courseAnchor(official.curriculum.id, official.semester, official.code, official.name)}`
    : null;

  return (
    <>
      <PageHeader
        eyebrow={semester ? `${program?.shortName ?? ""} · ${semester.name}` : "Subject"}
        title={subject.name}
        description={subject.description}
        crumbs={[
          { label: "Programs", href: "/programs" },
          ...(program ? [{ label: program.shortName, href: `/programs/${program.id}` }] : []),
          ...(semester ? [{ label: semester.name, href: `/semesters/${semester.id}` }] : []),
          { label: subject.code },
        ]}
        actions={
          <Button href={`/resources?programId=${subject.programId}&semesterId=${subject.semesterId}&subjectId=${subject.id}`} variant="outline" leftIcon={<Search className="h-4 w-4" aria-hidden />}>
            Search in subject
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">{subject.code}</Badge>
          {subject.credits != null && <Badge>{subject.credits} credits</Badge>}
          <Badge>
            {notes.length} published resource{notes.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </PageHeader>

      <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-10">
          {sections.length > 0 && (
            <nav aria-label="Resource types" className="flex flex-wrap gap-2">
              {sections.map((t) => (
                <a key={t} href={`#type-${t}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-sm text-text-2 transition-colors hover:border-primary/50 hover:text-text">
                  <ResourceTypeIcon type={t} className="h-4 w-4 text-lavender" aria-hidden />
                  {RESOURCE_TYPE_META[t].plural}
                  <span className="text-xs text-text-3">{byType.get(t)!.length}</span>
                </a>
              ))}
            </nav>
          )}

          {notes.length === 0 ? (
            <EmptyState icon={<FileQuestion className="h-6 w-6" aria-hidden />} title="No resources published for this subject yet" description="Check back soon — administrators add notes, papers and lab material regularly." />
          ) : (
            sections.map((t) => {
              const list = byType.get(t)!;
              return (
                <section key={t} id={`type-${t}`} className="scroll-mt-24" aria-labelledby={`h-${t}`}>
                  <h2 id={`h-${t}`} className="mb-4 flex items-center gap-2 text-xl font-bold text-text">
                    <ResourceTypeIcon type={t} className="h-5 w-5 text-primary" aria-hidden />
                    {RESOURCE_TYPE_META[t].plural}
                  </h2>
                  {t === "notes" ? <NotesByUnit notes={list} units={subject.units} /> : <NoteGrid notes={list} />}
                </section>
              );
            })
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
          {official && officialHref && (
            <Card className="space-y-3">
              <h2 className="flex items-center gap-2 font-semibold text-text">
                <BookMarked className="h-4 w-4 text-primary" aria-hidden />
                Official syllabus
              </h2>
              <p className="text-xs text-text-3">
                {official.curriculum.label} scheme · Semester {official.semester}
              </p>
              {official.syllabus.length === 0 ? (
                <p className="text-sm text-muted">{official.note ?? "The syllabus document doesn't cover this course."}</p>
              ) : (
                official.syllabus.map((e) => (
                  <details key={e.code + e.title} className="group text-sm">
                    <summary className="cursor-pointer list-none text-text-2 [&::-webkit-details-marker]:hidden">
                      {official.syllabus.length > 1 && <span className="block font-medium text-text">{e.title}</span>}
                      <span className="line-clamp-4 group-open:line-clamp-none">{e.topics || "No topic description in the syllabus."}</span>
                      <span className="mt-1 inline-block text-xs font-semibold text-lavender group-open:hidden">Show all topics</span>
                    </summary>
                  </details>
                ))
              )}
              <Link href={officialHref} className="inline-flex text-sm font-semibold text-lavender underline-offset-4 hover:underline">
                References and full curriculum →
              </Link>
            </Card>
          )}
          {(subject.units.length > 0 || !official) && (
          <Card>
            <h2 className="flex items-center gap-2 font-semibold text-text">
              <ListOrdered className="h-4 w-4 text-primary" aria-hidden />
              Syllabus units
            </h2>
            {subject.units.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Units haven&apos;t been added for this subject yet.</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {[...subject.units]
                  .sort((a, b) => a.number - b.number)
                  .map((u) => (
                    <li key={u.number} className="flex gap-3 text-sm">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-semibold text-lavender">{u.number}</span>
                      <span className="text-text-2">{u.title}</span>
                    </li>
                  ))}
              </ol>
            )}
          </Card>
          )}
        </aside>
      </Container>
    </>
  );
}

function NoteGrid({ notes }: { notes: NoteSummary[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {notes.map((n) => (
        <li key={n.id}>
          <NoteCard note={n} />
        </li>
      ))}
    </ul>
  );
}

function NotesByUnit({ notes, units }: { notes: NoteSummary[]; units: { number: number; title: string }[] }) {
  const groups = new Map<number | "general", NoteSummary[]>();
  for (const n of notes) {
    const key = n.unitNumber ?? "general";
    groups.set(key, [...(groups.get(key) ?? []), n]);
  }
  const keys = [...groups.keys()].sort((a, b) => (a === "general" ? 1 : b === "general" ? -1 : a - b));
  return (
    <div className="space-y-6">
      {keys.map((k) => {
        const unit = typeof k === "number" ? units.find((u) => u.number === k) : null;
        return (
          <div key={String(k)}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-3">
              {k === "general" ? "General" : unitLabel(k, unit?.title ?? null)}
            </h3>
            <NoteGrid notes={groups.get(k)!} />
          </div>
        );
      })}
    </div>
  );
}
