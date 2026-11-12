"use client";

/**
 * Admin auth state for client components.
 *
 * The server session cookie guards every admin page and API (including PDF
 * uploads), read via GET /api/auth/session. The browser Firebase SDK is only
 * used for the Google sign-in popup that creates that cookie.
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { signInAdminWithGoogle, signOutAdmin, type LoginResult } from "@/lib/auth/client";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";
import type { AdminSession } from "@/types/auth";

export interface UseAdminAuthOptions {
  /** Session already verified by a Server Component; skips the initial fetch. */
  initialUser?: AdminSession | null;
}

export interface AdminAuthApi {
  /** Server session (cookie-backed) or null. */
  user: AdminSession | null;
  loading: boolean;
  /** NEXT_PUBLIC_FIREBASE_* present in the browser bundle (needed for the sign-in popup). */
  clientConfigured: boolean;
  signIn: () => Promise<LoginResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAdminAuth(options: UseAdminAuthOptions = {}): AdminAuthApi {
  const router = useRouter();
  const hasInitial = options.initialUser !== undefined;
  const [user, setUser] = useState<AdminSession | null>(options.initialUser ?? null);
  const [loading, setLoading] = useState(!hasInitial);
  const [clientConfigured] = useState<boolean>(() => isFirebaseClientConfigured());

  const refresh = useCallback(async () => {
    try {
      const res = await api.auth.session();
      setUser(res.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasInitial) return;
    let cancelled = false;
    api.auth
      .session()
      .then((res) => !cancelled && setUser(res.user ?? null))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [hasInitial]);

  const signIn = useCallback(async () => {
    const result = await signInAdminWithGoogle();
    if (result.ok) await refresh();
    return result;
  }, [refresh]);

  const signOut = useCallback(async () => {
    await signOutAdmin();
    setUser(null);
    router.replace("/admin/login");
    router.refresh();
  }, [router]);

  return { user, loading, clientConfigured, signIn, signOut, refresh };
}
