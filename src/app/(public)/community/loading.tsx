import { Container } from "@/components/ui/Container";
import { CardSkeleton, Skeleton } from "@/components/ui/Feedback";

export default function PublicLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="border-b border-border bg-bg-2/60">
        <Container className="py-10 sm:py-14">
          <Skeleton className="mb-4 h-3 w-28" />
          <Skeleton className="mb-3 h-10 w-80 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </Container>
      </div>
      <Container className="py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </div>
  );
}
