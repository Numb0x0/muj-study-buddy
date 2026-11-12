import "server-only";
import { AdminConfigError, isAdminConfigured } from "@/lib/firebase/admin";

/**
 * Public pages must never crash because Firebase isn't configured yet.
 * `tryQuery` returns `fallback` on configuration errors (and logs other errors
 * in development) so pages render their empty states with a setup hint.
 */
export async function tryQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AdminConfigError) return fallback;
    const msg = err instanceof Error ? err.message : String(err);
    // Common when credentials are missing/invalid or emulator is down.
    if (/credential|UNAUTHENTICATED|ECONNREFUSED|PERMISSION_DENIED|Could not load the default credentials/i.test(msg)) {
      if (process.env.NODE_ENV !== "production") console.warn("[firebase] query skipped:", msg.split("\n")[0]);
      return fallback;
    }
    throw err;
  }
}

export interface SetupStatus {
  configured: boolean;
  emulators: boolean;
}

export function getSetupStatus(): SetupStatus {
  return {
    configured: isAdminConfigured(),
    emulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true",
  };
}
