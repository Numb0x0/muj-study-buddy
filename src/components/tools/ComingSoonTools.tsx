import { Layers, ListChecks, ListTodo, MessageSquareText, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface Upcoming {
  title: string;
  description: string;
  Icon: LucideIcon;
}

const UPCOMING: Upcoming[] = [
  { title: "AI PDF chat", description: "Ask questions about a published note and get cited answers.", Icon: MessageSquareText },
  { title: "Flashcards", description: "Spaced-repetition decks generated from unit notes.", Icon: Layers },
  { title: "MCQ generator", description: "Practice questions built from a subject's syllabus units.", Icon: ListChecks },
  { title: "Syllabus tracker", description: "Tick off units per subject and see what's left before exams.", Icon: ListTodo },
];

/** Deliberately non-interactive: no links, no buttons, clearly labelled. */
export function ComingSoonTools() {
  return (
    <section aria-labelledby="coming-soon-title" className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 id="coming-soon-title" className="text-xl font-bold tracking-tight text-text">
          On the roadmap
        </h2>
        <Badge variant="warning">Coming soon · not available yet</Badge>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {UPCOMING.map(({ title, description, Icon }) => (
          <li key={title} className="card-surface relative select-none border-dashed p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-2 text-text-3">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-text-2">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-text-3">{description}</p>
              </div>
            </div>
            <span className="mt-4 inline-block rounded-full border border-dashed border-border-2 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted">
              Coming soon
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
