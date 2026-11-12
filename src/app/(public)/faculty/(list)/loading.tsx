import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";

export default function FacultyLoading() {
  return (
    <div aria-busy="true" aria-label="Loading faculty directory">
      <div className="border-b border-border bg-bg-2/60">
        <Container className="py-10 sm:py-14">
          <Skeleton className="mb-5 h-4 w-32" />
          <Skeleton className="mb-3 h-3 w-28" />
          <Skeleton className="mb-4 h-10 w-72 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </Container>
      </div>
      <Container className="py-10 sm:py-14">
        <div className="mb-6 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-surface p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <div className="mt-4 flex gap-1.5">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
