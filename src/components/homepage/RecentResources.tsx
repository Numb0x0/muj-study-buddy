import { FileUp } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoteCard } from "@/components/resources/NoteCard";
import type { NoteSummary } from "@/types";

export function RecentResources({ notes, configured }: { notes: NoteSummary[]; configured: boolean }) {
  return (
    <section className="container-page pt-14" aria-labelledby="recent-title">
      <SectionHeading
        title={<span id="recent-title">Recently Added</span>}
        subtitle="The latest resources published by administrators."
        action={notes.length ? { label: "See everything", href: "/resources" } : undefined}
      />
      {notes.length === 0 ? (
        <EmptyState
          compact
          icon={<FileUp className="h-6 w-6" aria-hidden />}
          title="No resources published yet"
          description={
            configured
              ? "As soon as administrators publish notes, papers and lab material, they will show up here."
              : "Firebase is not configured yet — copy .env.example to .env.local to load real data."
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <li key={n.id}>
              <NoteCard note={n} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
