import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { CardSkeleton } from "@/components/ui/Feedback";
import { EMPTY_FILTERS, ResourceExplorer, type ExplorerFilters } from "@/components/resources/ResourceExplorer";
import { ResourcesHeader } from "@/components/resources/ResourcesHeader";
import { EMPTY_CATALOG, getCatalogTree, getSetupStatus, searchPublishedNotes, tryQuery } from "@/lib/queries";
import { noteSearchInput } from "@/lib/validations/note";
import type { NoteSummary, PaginatedResult } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resources",
  description: "Search and filter notes, previous year papers, assignments and lab resources for B.Tech Mechatronics and B.Tech Robotics & AI at MUJ.",
};

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const EMPTY_RESULT: PaginatedResult<NoteSummary> = { items: [], nextCursor: null, hasMore: false };

export default async function ResourcesPage(props: { searchParams: Promise<SP> }) {
  const sp = await props.searchParams;
  const filters: ExplorerFilters = {
    ...EMPTY_FILTERS,
    q: first(sp.q),
    programId: first(sp.programId),
    semesterId: first(sp.semesterId),
    subjectId: first(sp.subjectId),
    unit: first(sp.unit),
    type: first(sp.type),
    since: first(sp.since),
    sort: first(sp.sort) === "oldest" ? "oldest" : "newest",
  };

  const parsed = noteSearchInput.safeParse(Object.fromEntries(Object.entries({ ...filters, limit: "12" }).filter(([, v]) => v !== "")));
  let initialError: string | null = parsed.success ? null : "Some filters in the link are invalid and were ignored.";
  const [catalog, result] = await Promise.all([
    tryQuery(() => getCatalogTree(), EMPTY_CATALOG),
    parsed.success
      ? tryQuery(() => searchPublishedNotes(parsed.data), EMPTY_RESULT).catch((e: Error) => {
          initialError = e.message.split("\n")[0];
          return EMPTY_RESULT;
        })
      : Promise.resolve(EMPTY_RESULT),
  ]);

  return (
    <>
      <Suspense fallback={<div className="h-56 border-b border-border bg-bg-2/60" />}>
        <ResourcesHeader />
      </Suspense>
      <Container className="py-10">
        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <ResourceExplorer
            key={JSON.stringify(filters)}
            catalog={catalog}
            initialFilters={filters}
            initialResult={result}
            initialError={initialError}
            configured={getSetupStatus().configured}
          />
        </Suspense>
      </Container>
    </>
  );
}
