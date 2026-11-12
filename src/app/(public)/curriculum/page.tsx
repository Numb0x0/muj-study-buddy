import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FileText, Info, Layers } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { CourseRow } from "@/components/curriculum/CourseRow";
import { BATCH_ORDER, CURRICULA, DEFAULT_BATCH, courseAnchor, getCurriculum, isBatchId, isSlot, type BatchCurriculum, type BatchId, type OptionGroup } from "@/data/curriculum";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Curriculum & Syllabus",
  description: "Semester-wise scheme (L-T-P-C and credits), electives and syllabus topics for the MUJ Department of Mechatronics Engineering — B.Tech Robotics & AI (2024 batch and 2025–26 onwards); B.Tech Mechatronics coming soon.",
};

const groupAnchor = (batch: BatchId, id: string) => `b${batch}-${id}`;

export default async function CurriculumPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const raw = Array.isArray(sp.batch) ? sp.batch[0] : sp.batch;
  const batch: BatchId = isBatchId(raw) ? raw : DEFAULT_BATCH;
  const cur = getCurriculum(batch);
  const semesterCredits = cur.semesters.reduce((a, s) => a + s.totalCredits, 0);
  const flexi = cur.groups.filter((g) => g.id.startsWith("fc"));
  const electives = cur.groups.filter((g) => g.id.startsWith("pe"));

  return (
    <>
      <PageHeader
        eyebrow="Department of Mechatronics Engineering"
        title="Curriculum & syllabus"
        description="The official scheme for each branch and batch, semester by semester, with L-T-P-C, credits, electives and the syllabus topics for every course the documents cover."
        crumbs={[{ label: "Curriculum" }]}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm" aria-label="Branch">
            <span className="text-text-3">Branch:</span>
            <span className="rounded-full border border-primary/50 bg-primary/15 px-3 py-1 font-semibold text-lavender">B.Tech Robotics &amp; AI</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-text-3">
              B.Tech Mechatronics <Badge variant="warning">Coming soon</Badge>
            </span>
          </div>
          <BatchToggle active={batch} />
        </div>
      </PageHeader>

      <Container className="space-y-12 py-10 sm:py-14">
        <section aria-labelledby="overview" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Card className="space-y-3">
            <h2 id="overview" className="text-lg font-bold text-text">
              {cur.title}
            </h2>
            <p className="text-sm text-text-2">{cur.description}</p>
            <dl className="grid grid-cols-3 gap-3 pt-1 text-center">
              <Stat label="Total credits" value={String(cur.totalCredits)} />
              <Stat label="Semesters listed" value={`${cur.semesters[0].number}–${cur.semesters[cur.semesters.length - 1].number}`} />
              <Stat label="Credits listed" value={String(semesterCredits)} />
            </dl>
          </Card>
          <div className="space-y-3">
            {cur.coverageNote && (
              <Alert variant="info" title="What the documents cover">
                {cur.coverageNote}
              </Alert>
            )}
            <p className="text-sm text-text-3">
              <span className="font-semibold text-text-2">Reading the tables:</span> L = lecture, T = tutorial and P = practical hours per week; cr = credits. Codes ending in X (e.g. RAIXXXX) are placeholders exactly as printed in the scheme. Tap a course to see its topics and reference books.
            </p>
          </div>
        </section>

        <nav aria-label="Jump to semester" className="-mt-4 flex flex-wrap gap-2">
          {cur.semesters.map((s) => (
            <a key={s.number} href={`#b${batch}-sem-${s.number}`} className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-sm text-text-2 transition-colors hover:border-primary/50 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
              Semester {s.number}
            </a>
          ))}
          {electives.length > 0 && (
            <a href={`#b${batch}-electives`} className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-sm text-text-2 transition-colors hover:border-primary/50 hover:text-text">
              Electives
            </a>
          )}
        </nav>

        <div className="space-y-8">
          {cur.semesters.map((s) => (
            <section key={s.number} id={`b${batch}-sem-${s.number}`} aria-labelledby={`b${batch}-sem-${s.number}-h`} className="scroll-mt-24">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`b${batch}-sem-${s.number}-h`} className="text-xl font-bold text-text">
                  Semester {s.number}
                </h2>
                <Badge variant="primary">{s.totalCredits} credits</Badge>
              </div>
              <Card padding="none" className="overflow-hidden">
                <TableHead />
                <ul>
                  {s.courses.map((c, i) => {
                    const group = c.group ? cur.groups.find((g) => g.id === c.group) : undefined;
                    return (
                      <CourseRow
                        key={`${c.code}-${c.name}-${i}`}
                        curriculum={cur}
                        anchor={courseAnchor(batch, s.number, c.code, c.name)}
                        course={{ code: c.code, name: c.name, ltpc: c, kind: c.kind, syllabus: c.syllabus, note: c.note }}
                        slot={isSlot(c) && group ? { options: group.options, href: `#${groupAnchor(batch, group.id)}` } : undefined}
                      />
                    );
                  })}
                </ul>
              </Card>
            </section>
          ))}
        </div>

        {flexi.length > 0 && <GroupSection batch={batch} cur={cur} id={`b${batch}-flexi`} title="Flexi core options" intro="Each Flexi Core slot in the scheme is filled by one of these courses (3-1-0-4)." groups={flexi} />}
        {electives.length > 0 && <GroupSection batch={batch} cur={cur} id={`b${batch}-electives`} title="Program electives" intro="Each Program Elective slot is filled by one course from its list (3-0-0-3)." groups={electives} />}

        <section aria-labelledby={`b${batch}-oe`} className="space-y-3">
          <h2 id={`b${batch}-oe`} className="text-xl font-bold text-text">
            Open electives in the scheme
          </h2>
          <p className="text-sm text-text-3">The open-elective courses listed by the Mechatronics department (OE1–OE6).</p>
          <Card padding="none" className="overflow-hidden">
            <ul>
              {cur.openElectives.map((o) => (
                <CourseRow key={o.code} curriculum={cur} anchor={courseAnchor(batch, null, o.code, o.name)} course={{ code: o.code, name: o.name, syllabus: o.syllabus, note: o.note }} />
              ))}
            </ul>
          </Card>
        </section>

        {cur.tracks.map((t) => (
          <section key={t.id} aria-labelledby={`b${batch}-${t.id}`} className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id={`b${batch}-${t.id}`} className="text-xl font-bold text-text">
                {t.title}
              </h2>
              <Badge>{t.credits}</Badge>
            </div>
            <p className="text-sm text-text-3">Courses taken in addition to the regular scheme above.</p>
            <Card padding="none" className="overflow-hidden">
              <ul>
                {t.additions.flatMap((a) =>
                  a.courses.map((c, i) => (
                    <CourseRow
                      key={`${a.semester}-${c.code}-${i}`}
                      curriculum={cur}
                      anchor={courseAnchor(batch, a.semester, `${t.id}-${c.code}`, c.name)}
                      course={{ code: c.code, name: `${c.name} · Semester ${a.semester}`, ltpc: c, kind: c.kind, syllabus: c.syllabus, note: c.note }}
                    />
                  )),
                )}
              </ul>
            </Card>
            {t.electives?.map((e) => (
              <div key={e.title} className="space-y-2">
                <h3 className="font-semibold text-text">{e.title}</h3>
                <Card padding="none" className="overflow-hidden">
                  <ul>
                    {e.options.map((o) => (
                      <CourseRow key={o.code + o.name} curriculum={cur} anchor={courseAnchor(batch, null, `${t.id}-${o.code}`, o.name)} course={{ code: o.code, name: o.name, syllabus: o.syllabus, note: o.note }} />
                    ))}
                  </ul>
                </Card>
              </div>
            ))}
            {t.notes?.map((n) => (
              <p key={n} className="flex gap-2 text-sm text-text-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {n}
              </p>
            ))}
          </section>
        ))}

        <section aria-labelledby="sources" className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-2">
            <h2 id="sources" className="flex items-center gap-2 font-semibold text-text">
              <FileText className="h-4 w-4 text-primary" aria-hidden /> Source documents
            </h2>
            <ul className="space-y-1 text-sm text-text-2">
              <li>Scheme: {cur.sources.scheme}</li>
              <li>Syllabus: {cur.sources.syllabus}</li>
            </ul>
            <p className="text-xs text-text-3">Department of Mechatronics Engineering, School of Engineering, Manipal University Jaipur. Where the syllabus prints a different code from the scheme, the scheme&apos;s code is shown and the difference is noted under the course.</p>
          </Card>
          <Alert variant="warning" title="Always check with the department">
            This is a student-run copy of the official documents. Schemes and syllabi can be revised — confirm codes, credits and electives with the department or your faculty advisor before registering.
          </Alert>
        </section>

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/programs" className="inline-flex items-center gap-1.5 font-semibold text-lavender underline-offset-4 hover:underline">
            <Layers className="h-4 w-4" aria-hidden /> Browse notes by program and semester
          </Link>
          <Link href="/about#programme" className="inline-flex items-center gap-1.5 font-semibold text-lavender underline-offset-4 hover:underline">
            <BookOpen className="h-4 w-4" aria-hidden /> About the programme
          </Link>
        </div>
      </Container>
    </>
  );
}

function BatchToggle({ active }: { active: BatchId }) {
  return (
    <nav aria-label="Choose your batch" className="inline-flex rounded-2xl border border-border bg-bg-2/80 p-1">
      {BATCH_ORDER.map((b) => {
        const on = b === active;
        return (
          <Link
            key={b}
            href={b === DEFAULT_BATCH ? "/curriculum" : `/curriculum?batch=${b}`}
            aria-current={on ? "page" : undefined}
            scroll={false}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
              on ? "bg-primary-2 text-white shadow-glow-sm" : "text-text-2 hover:text-text",
            )}
          >
            {CURRICULA[b].label}
          </Link>
        );
      })}
    </nav>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-2/60 px-2 py-3">
      <dt className="text-[11px] uppercase tracking-[0.12em] text-text-3">{label}</dt>
      <dd className="mt-1 text-xl font-extrabold text-text">{value}</dd>
    </div>
  );
}

function TableHead() {
  return (
    <div className="hidden grid-cols-[8.5rem_minmax(0,1fr)_auto] gap-x-3 border-b border-border bg-bg-2/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-3 sm:grid" aria-hidden>
      <span>Code</span>
      <span>Course</span>
      <span className="flex items-center gap-3">
        <span className="flex gap-2 font-mono">
          <span className="w-4 text-center">L</span>
          <span className="w-4 text-center">T</span>
          <span className="w-4 text-center">P</span>
        </span>
        <span className="inline-flex min-w-[3.25rem] justify-end">Credits</span>
        <span className="w-4" />
      </span>
    </div>
  );
}

function GroupSection({ batch, cur, id, title, intro, groups }: { batch: BatchId; cur: BatchCurriculum; id: string; title: string; intro: string; groups: OptionGroup[] }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 space-y-4">
      <div>
        <h2 id={`${id}-h`} className="text-xl font-bold text-text">
          {title}
        </h2>
        <p className="mt-1 text-sm text-text-3">{intro}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((g) => (
          <div key={g.id} id={groupAnchor(batch, g.id)} className="scroll-mt-24 space-y-2">
            <h3 className="flex flex-wrap items-baseline gap-2 font-semibold text-text">
              {g.label} <span className="text-xs font-normal text-text-3">Semester {g.semester}</span>
            </h3>
            <Card padding="none" className="overflow-hidden">
              <ul>
                {g.options.map((o) => (
                  <CourseRow key={o.code + o.name} curriculum={cur} anchor={courseAnchor(batch, g.semester, o.code, o.name)} course={{ code: o.code, name: o.name, syllabus: o.syllabus, note: o.note }} />
                ))}
              </ul>
            </Card>
            {g.note && <p className="text-xs text-text-3">{g.note}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
