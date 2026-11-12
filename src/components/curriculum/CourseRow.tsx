import Link from "next/link";
import { ArrowDown, ChevronDown, Info, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { KIND_LABEL, syllabusFor, type BatchCurriculum, type CourseKind, type SyllabusEntry } from "@/data/curriculum";

interface RowCourse {
  code: string;
  name: string;
  /** Absent for elective options (their L-T-P-C is the slot's). */
  ltpc?: { l: number; t: number; p: number; c: number };
  kind?: CourseKind;
  syllabus?: string[];
  note?: string;
}

interface Props {
  curriculum: BatchCurriculum;
  course: RowCourse;
  anchor: string;
  /** For elective/flexi slots: the options and where they are listed. */
  slot?: { options: { code: string; name: string }[]; href: string };
}

const KIND_STYLE: Partial<Record<CourseKind, string>> = {
  lab: "border-sky-400/30 text-sky-300",
  project: "border-amber-400/30 text-amber-300",
  internship: "border-amber-400/30 text-amber-300",
  "program-elective": "border-primary/40 text-lavender",
  "flexi-core": "border-primary/40 text-lavender",
  "open-elective": "border-border-2 text-text-3",
  "honours-minor": "border-primary/40 text-lavender",
};

/** One course in a semester / elective list. Expands (no JS) to show the official syllabus when there is one. */
export function CourseRow({ curriculum, course, anchor, slot }: Props) {
  const entries = syllabusFor(curriculum, course.syllabus);
  const expandable = entries.length > 0 || Boolean(course.note);
  const kind = course.kind;
  const summary = (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 sm:grid-cols-[8.5rem_minmax(0,1fr)_auto] sm:items-center">
      <span className="order-2 col-span-2 font-mono text-xs tracking-wide text-text-3 sm:order-none sm:col-span-1 sm:text-[0.8rem]">{course.code}</span>
      <span className="order-1 min-w-0 sm:order-none">
        <span className="font-medium text-text">{course.name}</span>
        {kind && kind !== "theory" && (
          <span className={cn("ml-2 inline-flex rounded-full border px-2 py-px align-middle text-[11px] font-medium", KIND_STYLE[kind] ?? "border-border text-text-3")}>{KIND_LABEL[kind]}</span>
        )}
        {slot && slot.options.length > 0 && (
          <span className="mt-0.5 block text-xs text-text-3">
            Choose from: {slot.options.map((o) => o.name).join(" · ")}
          </span>
        )}
      </span>
      {course.ltpc ? (
        <span className="order-1 flex items-center gap-3 text-sm sm:order-none">
          <span className="hidden gap-2 font-mono text-xs text-text-3 sm:flex" aria-hidden>
            <span className="w-4 text-center">{course.ltpc.l}</span>
            <span className="w-4 text-center">{course.ltpc.t}</span>
            <span className="w-4 text-center">{course.ltpc.p}</span>
          </span>
          <span className="sr-only">
            Lecture {course.ltpc.l}, tutorial {course.ltpc.t}, practical {course.ltpc.p} hours per week, {course.ltpc.c} credits.
          </span>
          <span className="inline-flex min-w-[3.25rem] justify-end font-semibold text-text" aria-hidden>
            {course.ltpc.c} cr
          </span>
          {expandable ? <ChevronDown className="h-4 w-4 shrink-0 text-text-3 transition-transform group-open:rotate-180" aria-hidden /> : <span className="w-4" aria-hidden />}
        </span>
      ) : (
        <span className="order-1 sm:order-none">{expandable ? <ChevronDown className="h-4 w-4 text-text-3 transition-transform group-open:rotate-180" aria-hidden /> : <span className="inline-block w-4" aria-hidden />}</span>
      )}
    </div>
  );

  return (
    <li id={anchor} className="scroll-mt-28 border-b border-border/70 last:border-b-0">
      {expandable ? (
        <details className="group">
          <summary className="cursor-pointer list-none rounded-lg px-3 py-3 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 [&::-webkit-details-marker]:hidden">
            {summary}
            <span className="sr-only">{entries.length ? " — show syllabus" : " — show note"}</span>
          </summary>
          <div className="space-y-4 px-3 pb-5 pt-1 sm:pl-[calc(8.5rem+1.5rem)]">
            {course.note && (
              <p className="flex gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-text-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                <span>{course.note}</span>
              </p>
            )}
            {entries.map((e) => (
              <SyllabusBlock key={`${e.code}-${e.title}`} entry={e} showTitle={entries.length > 1} />
            ))}
            {entries.length > 0 && (
              <Link href={`/resources?q=${encodeURIComponent(course.name)}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-lavender underline-offset-4 hover:underline">
                <Search className="h-4 w-4" aria-hidden /> Find notes and papers for {course.name}
              </Link>
            )}
          </div>
        </details>
      ) : (
        <div className="px-3 py-3">
          {summary}
          {slot && (
            <Link href={slot.href} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-lavender underline-offset-4 hover:underline sm:ml-[calc(8.5rem+0.75rem)]">
              See the options and their syllabi <ArrowDown className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </li>
  );
}

function SyllabusBlock({ entry, showTitle }: { entry: SyllabusEntry; showTitle: boolean }) {
  return (
    <div className="space-y-3">
      {showTitle && (
        <h4 className="text-sm font-semibold text-text">
          {entry.title} <span className="font-mono text-xs font-normal text-text-3">({entry.code})</span>
        </h4>
      )}
      {entry.topics ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lavender">Topics</p>
          <p className="mt-1 text-sm leading-relaxed text-text-2">{entry.topics}</p>
        </div>
      ) : (
        <p className="text-sm text-text-3">The syllabus lists this course without a topic description.</p>
      )}
      {entry.references.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lavender">References</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-text-3 marker:text-muted">
            {entry.references.map((r, i) => (
              // The source repeats some references verbatim, so the index is part of the key.
              <li key={`${i}-${r.slice(0, 24)}`}>{r}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
