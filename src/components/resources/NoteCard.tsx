import Link from "next/link";
import { Download, Eye } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ResourceTypeIcon } from "@/components/ui/ResourceTypeIcon";
import { RESOURCE_TYPE_META } from "@/constants/resources";
import { publicFileUrl } from "@/lib/storage/paths";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import type { NoteSummary } from "@/types";

interface Props {
  note: NoteSummary;
  /** Compact single-row variant for sidebars. */
  compact?: boolean;
  className?: string;
}

export function NoteCard({ note, compact, className }: Props) {
  const meta = RESOURCE_TYPE_META[note.resourceType];
  const date = note.publishedAt ?? note.updatedAt;

  if (compact) {
    return (
      <Link
        href={`/notes/${note.id}`}
        className={cn("group flex items-start gap-3 rounded-xl border border-border bg-bg-2/60 p-3 transition-colors hover:border-primary/50 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/40", className)}
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-lavender">
          <ResourceTypeIcon type={note.resourceType} className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="line-clamp-2 text-sm font-medium text-text group-hover:text-lavender">{note.title}</span>
          <span className="mt-0.5 block text-xs text-text-3">
            {meta?.label}
            {note.unitNumber ? ` · Unit ${note.unitNumber}` : ""}
          </span>
        </span>
      </Link>
    );
  }

  const extraTags = note.tags.length - 3;
  return (
    <article className={cn("card-surface card-hover group relative flex h-full flex-col p-5 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/40", className)}>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-lavender">
          <ResourceTypeIcon type={note.resourceType} className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="primary">{meta?.label ?? note.resourceType}</Badge>
            {note.unitNumber && <Badge variant="outline">Unit {note.unitNumber}</Badge>}
          </div>
          <h3 className="mt-2 line-clamp-2 font-semibold leading-snug text-text">
            <Link href={`/notes/${note.id}`} className="after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:outline-none">
              {note.title}
            </Link>
          </h3>
          <p className="mt-1 truncate text-sm text-text-3">
            <span className="font-medium text-text-2">{note.subjectCode}</span> · {note.subjectName}
          </p>
          <p className="text-xs text-muted">
            Semester {note.semesterNumber}
            {note.unitTitle && note.unitTitle.toLowerCase() !== `unit ${note.unitNumber}` ? ` · ${note.unitTitle}` : ""}
          </p>
        </div>
      </div>

      {note.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
          {note.tags.slice(0, 3).map((t) => (
            <li key={t}>
              <Badge>#{t}</Badge>
            </li>
          ))}
          {extraTags > 0 && (
            <li>
              <Badge variant="outline">+{extraTags}</Badge>
            </li>
          )}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-text-3">
        <span>
          {formatBytes(note.fileSizeBytes)}
          {note.pageCount ? ` · ${note.pageCount} pages` : ""} · {formatDate(date)}
        </span>
        <span className="relative z-10 flex items-center gap-1">
          <Link
            href={`/notes/${note.id}`}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-text-2 transition-colors hover:bg-white/5 hover:text-text"
            aria-label={`View ${note.title}`}
          >
            <Eye className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">View</span>
          </Link>
          <a
            href={publicFileUrl(note.id, { download: true })}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-lavender transition-colors hover:bg-primary/10"
            aria-label={`Download ${note.title}`}
            download
          >
            <Download className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Download</span>
          </a>
        </span>
      </div>
    </article>
  );
}
