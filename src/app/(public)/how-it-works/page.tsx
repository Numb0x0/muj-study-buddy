import type { Metadata } from "next";
import { BookOpenCheck, Download, Eye, FileCheck2, FileUp, GraduationCap, Layers, Rocket, Search, ShieldCheck, Wrench } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "How it Works", description: "How to find, preview and download resources on MUJ Study Buddy, and how resources get published." };

const STUDENT_STEPS = [
  { Icon: GraduationCap, t: "Pick your program", d: "Start from Degree Programs, or jump straight into the resource library." },
  { Icon: Layers, t: "Choose semester & subject", d: "Each subject lists its syllabus units and every published resource, grouped by type." },
  { Icon: Eye, t: "Preview or download", d: "Read PDFs in the built-in viewer with zoom, page navigation and full screen — or download them." },
  { Icon: Wrench, t: "Use the tools", d: "Work out your SGPA/CGPA, track attendance and run focus sessions." },
];

const ADMIN_STEPS = [
  { Icon: FileUp, t: "Upload", d: "An administrator drops a PDF into the dashboard. Type and size are checked." },
  { Icon: BookOpenCheck, t: "Save as draft", d: "The file is stored privately with its program, semester, subject, unit and tags." },
  { Icon: FileCheck2, t: "Preview", d: "The admin opens the draft, checks it and fixes any details." },
  { Icon: ShieldCheck, t: "Publish", d: "The server verifies the admin, copies the file to public storage and lists it." },
];

const FAQ = [
  { q: "Do I need an account?", a: "No. Browsing, previewing and downloading are open to everyone. Only administrators sign in." },
  { q: "Can I upload my own notes?", a: "Not directly yet. Send them through the contact page and an administrator can review and publish them." },
  { q: "Does search look inside PDFs?", a: "Not yet. Search matches titles, subjects, course codes, units and tags. Full-text search is on the roadmap." },
  { q: "Something is wrong or outdated — what do I do?", a: "Use the contact page with the resource link. Administrators can unpublish or replace a file in seconds." },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader eyebrow="How it works" title="From syllabus to study session in a few clicks" description="Everything is organised Program → Semester → Subject → Unit, so the right PDF is never more than a few clicks away." crumbs={[{ label: "How it Works" }]} />
      <Container className="space-y-14 py-10 sm:py-14">
        <StepList title="For students" steps={STUDENT_STEPS} />
        <StepList title="For administrators" steps={ADMIN_STEPS} />

        <section aria-labelledby="faq-title">
          <h2 id="faq-title" className="mb-5 text-2xl font-bold text-text">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group card-surface p-5 open:border-primary/40">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-text [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-xl text-lavender transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-text-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button href="/resources" leftIcon={<Search className="h-4 w-4" aria-hidden />}>
            Browse resources
          </Button>
          <Button href="/programs" variant="outline" leftIcon={<Rocket className="h-4 w-4" aria-hidden />}>
            Degree programs
          </Button>
          <Button href="/resources?type=pyq" variant="ghost" leftIcon={<Download className="h-4 w-4" aria-hidden />}>
            Previous year papers
          </Button>
        </div>
      </Container>
    </>
  );
}

function StepList({ title, steps }: { title: string; steps: { Icon: React.ComponentType<{ className?: string }>; t: string; d: string }[] }) {
  return (
    <section>
      <h2 className="mb-5 text-2xl font-bold text-text">{title}</h2>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ Icon, t, d }, i) => (
          <li key={t} className="card-surface relative p-5">
            <span className="absolute right-4 top-4 text-3xl font-extrabold text-white/5">{i + 1}</span>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-lavender">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-text">{t}</h3>
            <p className="mt-1 text-sm text-text-3">{d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
