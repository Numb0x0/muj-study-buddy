import { getSetupStatus } from "@/lib/queries/safe";

/** Muted one-liner shown under empty states when Firebase isn't configured. */
export function SetupHint() {
  if (getSetupStatus().configured) return null;
  return (
    <p className="mt-4 text-center text-xs text-muted">
      Firebase not configured yet — copy <code className="rounded bg-white/5 px-1 py-0.5">.env.example</code> to{" "}
      <code className="rounded bg-white/5 px-1 py-0.5">.env.local</code> to load real data.
    </p>
  );
}
