"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function FacultyError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[faculty] render failed", error);
  }, [error]);

  return (
    <Container className="py-16">
      <EmptyState
        icon={<AlertTriangle className="h-6 w-6 text-warning" aria-hidden />}
        title="We couldn't load the faculty directory"
        description="Something went wrong while fetching profiles. Please try again in a moment."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>Try again</Button>
            <Button href="/" variant="outline">
              Back to home
            </Button>
          </div>
        }
      />
    </Container>
  );
}
