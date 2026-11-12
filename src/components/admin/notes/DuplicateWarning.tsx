import Link from "next/link";
import { Alert } from "@/components/ui/Feedback";
import { StatusBadge } from "../StatusBadge";
import type { NoteSummary } from "@/types";

export function DuplicateWarning({ duplicates }: { duplicates: NoteSummary[] }) {
  if (!duplicates.length) return null;
  return (
    <Alert variant="warning" title={`Possible duplicate${duplicates.length > 1 ? "s" : ""}`}>
      <p>The same file or title already exists:</p>
      <ul className="mt-2 space-y-1">
        {duplicates.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/notes/${d.id}`} className="font-medium text-text underline-offset-4 hover:underline">
              {d.title}
            </Link>
            <span className="text-xs text-text-3">
              {d.subjectCode} · Sem {d.semesterNumber}
            </span>
            <StatusBadge status={d.status} />
          </li>
        ))}
      </ul>
    </Alert>
  );
}
