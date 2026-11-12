"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { FileSearch, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert, CardSkeleton } from "@/components/ui/Feedback";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { useCatalogCascade } from "@/hooks/useCatalogCascade";
import { SEARCH_TYPE_OPTIONS } from "@/constants/resources";
import { toQueryString } from "@/lib/utils";
import type { CatalogTree } from "@/lib/queries/catalog";
import type { NoteSummary, PaginatedResult } from "@/types";
import { NoteCard } from "./NoteCard";

export interface ExplorerFilters {
  q: string;
  programId: string;
  semesterId: string;
  subjectId: string;
  unit: string;
  type: string;
  since: string;
  sort: "newest" | "oldest";
}

export const EMPTY_FILTERS: ExplorerFilters = { q: "", programId: "", semesterId: "", subjectId: "", unit: "", type: "", since: "", sort: "newest" };

const SINCE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 3 months" },
  { value: "365", label: "Last year" },
];

interface Props {
  catalog: CatalogTree;
  initialFilters: ExplorerFilters;
  initialResult: PaginatedResult<NoteSummary>;
  initialError: string | null;
  configured: boolean;
}

function filtersToParams(f: ExplorerFilters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(f)) {
    if (!v) continue;
    if (k === "sort" && v === "newest") continue;
    out[k] = v;
  }
  return out;
}

export function ResourceExplorer({ catalog, initialFilters, initialResult, initialError, configured }: Props) {
  const pathname = usePathname();

  const [filters, setFilters] = React.useState<ExplorerFilters>(initialFilters);
  const [query, setQuery] = React.useState(initialFilters.q);
  const [result, setResult] = React.useState<PaginatedResult<NoteSummary>>(initialResult);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(initialError);
  const [showFilters, setShowFilters] = React.useState(false);
  const requestId = React.useRef(0);

  const cascade = useCatalogCascade(catalog, filters);

  const fetchPage = React.useCallback(async (f: ExplorerFilters, cursor?: string) => {
    const res = await fetch(`/api/notes${toQueryString({ ...filtersToParams(f), cursor, limit: 12 })}`, { headers: { Accept: "application/json" } });
    const body = (await res.json().catch(() => null)) as (PaginatedResult<NoteSummary> & { error?: string }) | null;
    if (!res.ok || !body) throw new Error(body?.error ?? `Search failed (${res.status}).`);
    return body;
  }, []);

  /** Apply new filters: sync the URL (no server round-trip) and fetch the first page. */
  const apply = (next: ExplorerFilters) => {
    setFilters(next);
    const qs = toQueryString(filtersToParams(next));
    if (qs !== window.location.search) window.history.replaceState(window.history.state, "", `${pathname}${qs}`);
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    fetchPage(next)
      .then((r) => {
        if (id === requestId.current) setResult(r);
      })
      .catch((e: Error) => {
        if (id === requestId.current) setError(e.message);
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  };

  const update = (patch: Partial<ExplorerFilters>) => apply({ ...filters, ...patch });
  const debouncedSearch = useDebouncedCallback((q: string) => update({ q }), 300);

  const onQueryChange = (q: string) => {
    setQuery(q);
    debouncedSearch.run(q);
  };

  const loadMore = async () => {
    if (!result.nextCursor) return;
    const id = requestId.current; // a filter change bumps this; ignore stale pages
    setLoadingMore(true);
    try {
      const next = await fetchPage(filters, result.nextCursor);
      if (id !== requestId.current) return;
      setResult((r) => {
        const seen = new Set(r.items.map((n) => n.id));
        return { items: [...r.items, ...next.items.filter((n) => !seen.has(n.id))], nextCursor: next.nextCursor, hasMore: next.hasMore };
      });
    } catch (e) {
      if (id === requestId.current) setError((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
  };

  const clearAll = () => {
    debouncedSearch.cancel();
    setQuery("");
    apply(EMPTY_FILTERS);
  };

  const retry = () => apply(filters);

  const activeCount = Object.entries(filtersToParams(filters)).filter(([k]) => k !== "q").length;

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
      {/* Filters */}
      <aside aria-label="Filters" className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between lg:hidden">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
            aria-controls="resource-filters"
            leftIcon={<SlidersHorizontal className="h-4 w-4" aria-hidden />}
          >
            Filters{activeCount ? ` (${activeCount})` : ""}
          </Button>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>
              Clear
            </Button>
          )}
        </div>
        <div id="resource-filters" className={`card-surface mt-3 space-y-4 p-5 lg:mt-0 lg:block ${showFilters ? "block" : "hidden"}`}>
          <Select
            label="Degree program"
            value={filters.programId}
            onChange={(e) => update({ programId: e.target.value, semesterId: "", subjectId: "", unit: "" })}
            options={cascade.programOptions}
            placeholder="All programs"
          />
          <Select
            label="Semester"
            value={filters.semesterId}
            onChange={(e) => update({ semesterId: e.target.value, subjectId: "", unit: "" })}
            options={cascade.semesterOptions}
            placeholder={filters.programId ? "All semesters" : "Choose a program first"}
            disabled={!filters.programId}
          />
          <Select
            label="Subject"
            value={filters.subjectId}
            onChange={(e) => update({ subjectId: e.target.value, unit: "" })}
            options={cascade.subjectOptions}
            placeholder={filters.semesterId ? "All subjects" : "Choose a semester first"}
            disabled={!filters.semesterId}
          />
          <Select
            label="Unit"
            value={filters.unit}
            onChange={(e) => update({ unit: e.target.value })}
            options={cascade.unitOptions}
            placeholder={filters.subjectId ? "All units" : "Choose a subject first"}
            disabled={!filters.subjectId || cascade.unitOptions.length === 0}
          />
          <Select label="Resource type" value={filters.type} onChange={(e) => update({ type: e.target.value })} options={SEARCH_TYPE_OPTIONS} placeholder="All types" />
          <Select label="Uploaded" value={filters.since} onChange={(e) => update({ since: e.target.value })} options={SINCE_OPTIONS} placeholder="Any time" />
          <Select
            label="Sort by"
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as ExplorerFilters["sort"] })}
            options={[
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
            ]}
          />
          <Button variant="outline" size="sm" className="w-full" onClick={clearAll} disabled={activeCount === 0 && !filters.q} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>
            Clear filters
          </Button>
        </div>
      </aside>

      {/* Results */}
      <div className="min-w-0">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            debouncedSearch.cancel();
            update({ q: query });
          }}
          className="relative"
        >
          <label htmlFor="resource-search" className="sr-only">
            Search resources
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-3" aria-hidden />
          <input
            id="resource-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by title, subject, course code, unit or tag…"
            className="field h-12 rounded-2xl pl-12 pr-11 text-base"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-text-3 hover:bg-white/5 hover:text-text"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </form>
        <p className="mt-2 text-xs text-muted">Search matches titles, subjects, course codes, units and tags — not the text inside PDFs.</p>

        <div className="mt-6 flex items-center justify-between gap-3" aria-live="polite">
          <p className="text-sm text-text-3">
            {loading ? "Searching…" : `Showing ${result.items.length} resource${result.items.length === 1 ? "" : "s"}${result.hasMore ? " (more available)" : ""}`}
          </p>
        </div>

        {error && (
          <Alert variant="danger" title="Couldn't load resources" className="mt-4">
            <p>{error}</p>
            <button type="button" onClick={retry} className="mt-2 font-semibold text-text underline-offset-4 hover:underline">
              Try again
            </button>
          </Alert>
        )}

        <div className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : result.items.length === 0 && !error ? (
            <EmptyState
              icon={<FileSearch className="h-6 w-6" aria-hidden />}
              title={activeCount || filters.q ? "No resources match these filters" : "No resources published yet"}
              description={
                !configured
                  ? "Firebase is not configured yet — copy .env.example to .env.local to load real data."
                  : activeCount || filters.q
                    ? "Try a broader search, or clear some filters."
                    : "Administrators haven't published any resources yet. Check back soon."
              }
              action={
                activeCount || filters.q ? (
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {result.items.map((n) => (
                  <li key={n.id}>
                    <NoteCard note={n} />
                  </li>
                ))}
              </ul>
              {result.hasMore && (
                <div className="mt-8 flex justify-center">
                  <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
