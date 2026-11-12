"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, GraduationCap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { signInAdminWithGoogle, warmUpAdminSignIn, type LoginResult } from "@/lib/auth/client";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";

function safeNext(next: string | null): string {
  // Only allow same-site admin paths (prevents open redirects).
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export function LoginCard({ serverConfigured, emulators }: { serverConfigured: boolean; emulators: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<LoginResult | null>(null);
  const clientConfigured = isFirebaseClientConfigured();
  const configured = serverConfigured && clientConfigured;

  // Load Firebase Auth before the click so the Google popup can open immediately.
  React.useEffect(() => {
    if (configured) warmUpAdminSignIn();
  }, [configured]);

  const signIn = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await signInAdminWithGoogle();
      if (r.ok) {
        router.replace(safeNext(params.get("next")));
        router.refresh();
        return; // keep the spinner while navigating
      }
      setResult(r);
    } catch (err) {
      setResult({ ok: false, code: "UNKNOWN", error: err instanceof Error ? err.message : "Sign-in failed." });
    }
    setLoading(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="card-surface border-primary/30 p-7 shadow-glow sm:p-9">
        <Link href="/" className="inline-flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" aria-hidden />
          <span className="text-lg font-bold">
            <span className="text-text">MUJ </span>
            <span className="text-gradient">Study Buddy</span>
          </span>
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-text">Administrator sign-in</h1>
        <p className="mt-2 text-sm text-text-3">Students don&apos;t need to sign in — every published resource is public. This page is only for pre-authorised administrators.</p>

        <div className="mt-6 space-y-3">
          {!configured && (
            <Alert variant="warning" title="Firebase isn't configured">
              Copy <code>.env.example</code> to <code>.env.local</code>, add your Firebase keys (or enable the emulators), then restart <code>npm run dev</code>.
            </Alert>
          )}
          {result?.code === "NOT_ADMIN" && (
            <Alert variant="danger" title="Not an administrator">
              {result.error} Ask the project owner to run <code>npm run admin:grant -- your@email</code>, then sign in again.
            </Alert>
          )}
          {result?.code === "POPUP_CLOSED" && <Alert variant="info">The sign-in window was closed before finishing.</Alert>}
          {result?.code === "POPUP_BLOCKED" && (
            <Alert variant="warning" title="Pop-up blocked">
              Your browser blocked the Google sign-in window. Allow pop-ups for this site (Safari: Settings → Websites → Pop-up Windows; Chrome: the icon at the right of the address bar), then click the button again.
            </Alert>
          )}
          {result && !["NOT_ADMIN", "POPUP_CLOSED", "POPUP_BLOCKED"].includes(result.code ?? "") && (
            <Alert variant="danger" title="Sign-in failed">
              {result.error}
            </Alert>
          )}
        </div>

        <Button onClick={signIn} loading={loading} disabled={!configured} size="lg" variant="secondary" className="mt-6 w-full bg-white text-[#1f1f1f] hover:bg-white/90" leftIcon={!loading ? <GoogleG /> : undefined}>
          Continue with Google
        </Button>

        <p className="mt-5 flex items-start gap-2 text-xs text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
          Signing in with Google doesn&apos;t grant access by itself. Accounts need an administrator role assigned on the server.
        </p>
        {emulators && <p className="mt-3 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-xs text-info">Emulator mode: the Google popup is simulated by the Firebase Auth emulator.</p>}
      </div>
      <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-sm text-text-3 hover:text-text">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to the site
      </Link>
    </div>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
