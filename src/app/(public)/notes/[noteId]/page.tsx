import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Download, ExternalLink, FileText, HardDrive, Layers } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/layout/PageHeader";
import { NoteCard } from "@/components/resources/NoteCard";
import { PdfViewerLoader } from "@/components/pdf-viewer/PdfViewerLoader";
import { RESOURCE_TYPE_META } from "@/constants/resources";
import { getPublishedNote, getRelatedNotes, tryQuery } from "@/lib/queries";
import { publicFileUrl } from "@/lib/storage/paths";
import { formatBytes, formatDate, truncate, unitLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

const loadNote = cache((id: string) => tryQuery(() => getPublishedNote(id), null));

export async function generateMetadata(props: { params: Promise<{ noteId: string }> }): Promise<Metadata> {
  const { noteId } = await props.params;
  const note = await loadNote(noteId);
  if (!note) return { title: "Resource not found", robots: { index: false } };
  const description = note.description ? truncate(note.description, 155) : `${RESOURCE_TYPE_META[note.resourceType].label} for ${note.subjectCode} ${note.subjectName}, Semester ${note.semesterNumber}.`;
  return { title: note.title, description, openGraph: { title: note.title, description, type: "article" } };
}

export default async function NotePage(props: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await props.params;
  const note = await loadNote(noteId);
  if (!note) notFound();
  const related = await tryQuery(() => getRelatedNotes(note, 6), []);
  const meta = RESOURCE_TYPE_META[note.resourceType];
  const fileUrl = publicFileUrl(note.id);
  const downloadUrl = publicFileUrl(note.id, { download: true });

  return (
    <Container className="py-8 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Programs", href: "/programs" },
          { label: note.programName, href: `/programs/${note.programId}` },
          { label: `Semester ${note.semesterNumber}`, href: `/semesters/${note.semesterId}` },
          { label: note.subjectCode, href: `/subjects/${note.subjectId}` },
          { label: truncate(note.title, 40) },
        ]}
      />

      <header className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">{meta.label}</Badge>
            {note.unitNumber && <Badge variant="outline">{unitLabel(note.unitNumber, note.unitTitle)}</Badge>}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">{note.title}</h1>
          <p className="mt-2 text-text-3">
            <Link href={`/subjects/${note.subjectId}`} className="font-medium text-lavender underline-offset-4 hover:underline">
              {note.subjectCode} · {note.subjectName}
            </Link>{" "}
            · Semester {note.semesterNumber} · {note.programName}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href={`/subjects/${note.subjectId}`} variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
            Back to subject
          </Button>
          <Button href={downloadUrl} leftIcon={<Download className="h-4 w-4" aria-hidden />} download>
            Download PDF
          </Button>
        </div>
      </header>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <PdfViewerLoader fileUrl={fileUrl} downloadUrl={downloadUrl} title={note.title} initialPageCount={note.pageCount} />
          <p className="mt-2 text-xs text-muted">
            Trouble viewing?{" "}
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-lavender hover:underline">
              Open in a new tab <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </p>
        </div>

        <aside className="space-y-6">
          <Card>
            <h2 className="font-semibold text-text">About this resource</h2>
            {note.description && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-2">{note.description}</p>}
            <dl className="mt-4 space-y-2.5 text-sm">
              <Meta icon={<FileText className="h-4 w-4" />} label="Type" value={meta.label} />
              <Meta icon={<Layers className="h-4 w-4" />} label="Pages" value={note.pageCount ? String(note.pageCount) : "—"} />
              <Meta icon={<HardDrive className="h-4 w-4" />} label="Size" value={formatBytes(note.fileSizeBytes)} />
              <Meta icon={<CalendarDays className="h-4 w-4" />} label="Published" value={formatDate(note.publishedAt)} />
            </dl>
            {note.tags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
                {note.tags.map((t) => (
                  <li key={t}>
                    <Link href={`/resources?q=${encodeURIComponent(t)}`}>
                      <Badge className="hover:border-primary/50">#{t}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <section aria-labelledby="related-title">
            <h2 id="related-title" className="mb-3 font-semibold text-text">
              More from {note.subjectCode}
            </h2>
            {related.length === 0 ? (
              <p className="text-sm text-muted">No other resources for this subject yet.</p>
            ) : (
              <ul className="space-y-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <NoteCard note={r} compact />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </Container>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-text-3">
        <span className="text-primary" aria-hidden>
          {icon}
        </span>
        {label}
      </dt>
      <dd className="text-text-2">{value}</dd>
    </div>
  );
}
