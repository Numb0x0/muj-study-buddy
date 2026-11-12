"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10 text-danger">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-text sm:text-3xl">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-text-3">
        An unexpected error occurred while rendering this page. {error.digest && <span className="text-muted">(ref {error.digest})</span>}
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>
          Try again
        </Button>
        <Button href="/" variant="outline">
          Go home
        </Button>
      </div>
    </div>
  );
}
