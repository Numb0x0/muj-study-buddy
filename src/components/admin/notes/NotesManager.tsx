"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileSearch, Pencil, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Feedback";
import { RESOURCE_TYPE_META, RESOURCE_TYPE_OPTIONS } from "@/constants/resources";
import { api, errorMessage } from "@/lib/api-client";
import { cn, formatBytes, toQueryString } from "@/lib/utils";
import type { CatalogTree } from "@/lib/queries/catalog";
import type { Note, PaginatedResult } from "@/types";
import { programLabel, semesterLabel, semestersOf, subjectLabel, subjectsOf } from "../cascade";
import { RelativeTime } from "../RelativeTime";
import { StatusBadge } from "../StatusBadge";
import { NoteActions } from "./NoteActions";

export interface NotesFilter {
  status: "all" | "draft" | "published" | "archived";
  q: string;
  programId: string;
  semesterId: string;
  subjectId: string;
  type: string;
}

const TABS: { value: NotesFilter["status"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function NotesManager({ catalog, filter, initial, initialError }: { catalog: CatalogTree; filter: NotesFilter; initial: PaginatedResult<Note>; initialError: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = React.useState(initial.items);
  const [cursor, setCursor] = React.useState(initial.nextCursor);
  const [hasMore, setHasMore] = React.useState(initial.hasMore);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState(initialError);
  const [q, setQ] = React.useState(filter.q);

  const navigate = (patch: Partial<NotesFilter>) => {
    const next = { ...filter, ...patch };
    router.push(`${pathname}${toQueryString({ ...next, status: next.status === "all" ? "" : next.status })}`);
  };

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await api.adminNotes.list({ ...filter, q: filter.q || undefined, type: filter.type || undefined, programId: filter.programId || undefined, semesterId: filter.semesterId || undefined, subjectId: filter.subjectId || undefined, cursor, limit: 20 });
      setItems((list) => [...list, ...res.items]);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const replace = (n: Note) => {
    // If the note no longer matches the current status tab, drop it from the list.
    if (filter.status !== "all" && n.status !== filter.status) setItems((l) => l.filter((x) => x.id !== n.id));
    else setItems((l) => l.map((x) => (x.id === n.id ? n : x)));
    router.refresh();
  };

  const semesters = semestersOf(catalog, filter.programId);
  const subjects = subjectsOf(catalog, filter.semesterId);
  const filtered = Boolean(filter.q || filter.programId || filter.type);

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Status" className="flex flex-wrap gap-1 rounded-xl border border-border bg-bg-2 p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={filter.status === t.value}
            onClick={() => navigate({ status: t.value })}
            className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors", filter.status === t.value ? "bg-primary/20 text-lavender" : "text-text-3 hover:text-text")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ q });
          }}
          className="relative"
        >
          <label htmlFor="admin-note-search" className="sr-only">
            Search notes
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" aria-hidden />
          <input id="admin-note-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, code, tag… (Enter)" className="field pl-9" />
        </form>
        <Select aria-label="Program" value={filter.programId} onChange={(e) => navigate({ programId: e.target.value, semesterId: "", subjectId: "" })} options={catalog.programs.map((p) => ({ value: p.id, label: programLabel(p) }))} placeholder="All programs" />
        <Select aria-label="Semester" value={filter.semesterId} onChange={(e) => navigate({ semesterId: e.target.value, subjectId: "" })} options={semesters.map((s) => ({ value: s.id, label: semesterLabel(s) }))} placeholder="All semesters" disabled={!filter.programId} />
        <Select aria-label="Subject" value={filter.subjectId} onChange={(e) => navigate({ subjectId: e.target.value })} options={subjects.map((s) => ({ value: s.id, label: subjectLabel(s) }))} placeholder="All subjects" disabled={!filter.semesterId} />
        <Select aria-label="Type" value={filter.type} onChange={(e) => navigate({ type: e.target.value })} options={RESOURCE_TYPE_OPTIONS} placeholder="All types" />
      </div>

      {error && <Alert variant="danger" title="Couldn't load notes">{error}</Alert>}

      {items.length === 0 ? (
        <EmptyState
          icon={<FileSearch className="h-6 w-6" aria-hidden />}
          title={filtered ? "No notes match these filters" : filter.status === "draft" ? "No drafts" : filter.status === "published" ? "Nothing published yet" : filter.status === "archived" ? "Nothing archived" : "No notes yet"}
          description={filtered ? "Try clearing some filters." : "Upload a PDF to get started."}
          action={
            filtered ? (
              <Button variant="outline" size="sm" onClick={() => router.push(`${pathname}${filter.status !== "all" ? `?status=${filter.status}` : ""}`)}>
                Clear filters
              </Button>
            ) : (
              <Button href="/admin/notes/new" size="sm" leftIcon={<Upload className="h-4 w-4" aria-hidden />}>
                Upload PDF
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id} className="card-surface p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={n.status} />
                    <Badge variant="primary">{RESOURCE_TYPE_META[n.resourceType]?.label}</Badge>
                    <span className="text-xs text-text-3">v{n.version}</span>
                  </div>
                  <Link href={`/admin/notes/${n.id}`} className="mt-1.5 block truncate font-semibold text-text hover:text-lavender">
                    {n.title}
                  </Link>
                  <p className="text-xs text-text-3">
                    {n.subjectCode} · Sem {n.semesterNumber}
                    {n.unitNumber ? ` · Unit ${n.unitNumber}` : ""} · {formatBytes(n.fileSizeBytes)} · updated <RelativeTime iso={n.updatedAt} />
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button href={`/admin/notes/${n.id}`} size="sm" variant="ghost" leftIcon={<Pencil className="h-3.5 w-3.5" aria-hidden />}>
                    Preview / edit
                  </Button>
                  <NoteActions note={n} onChanged={replace} onDeleted={() => setItems((l) => l.filter((x) => x.id !== n.id))} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
