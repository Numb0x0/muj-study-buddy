import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="glow-blob absolute left-1/2 top-1/3 h-80 w-[40rem] -translate-x-1/2" aria-hidden />
      <div className="relative">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lavender">404</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-text sm:text-5xl">Page not found</h1>
        <p className="mx-auto mt-4 max-w-md text-text-3">The page you are looking for doesn&apos;t exist, was moved, or hasn&apos;t been published yet.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/" leftIcon={<Home className="h-4 w-4" aria-hidden />}>
            Back home
          </Button>
          <Button href="/resources" variant="outline" leftIcon={<Search className="h-4 w-4" aria-hidden />}>
            Browse resources
          </Button>
          <Button href="/programs" variant="ghost" leftIcon={<Compass className="h-4 w-4" aria-hidden />}>
            Degree programs
          </Button>
        </div>
        <p className="mt-10 text-xs text-muted">
          <Link href="/contact" className="underline-offset-4 hover:underline">
            Report a broken link
          </Link>
        </p>
      </div>
    </div>
  );
}
