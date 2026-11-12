"use client";

/**
 * Browser helpers for the admin login flow.
 * Google sign-in → ID token → POST /api/auth/session → httpOnly cookie.
 */
import { GoogleAuthProvider, signInWithPopup, signOut, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

export interface LoginResult {
  ok: boolean;
  error?: string;
  code?: "NOT_ADMIN" | "POPUP_CLOSED" | "POPUP_BLOCKED" | "NOT_CONFIGURED" | "UNKNOWN";
}

/**
 * Start loading Firebase Auth (and, on Safari/mobile, its sign-in iframe) before
 * the user clicks. If that loading happens inside the click, the popup opens
 * only after a network round-trip and browsers block it (auth/popup-blocked).
 */
export function warmUpAdminSignIn(): void {
  try {
    getFirebaseAuth();
  } catch {
    // Not configured — the login card shows its own warning.
  }
}

export async function signInAdminWithGoogle(): Promise<LoginResult> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  let user: User;
  try {
    const cred = await signInWithPopup(auth, provider);
    user = cred.user;
  } catch (err) {
    const code = (err as { code?: string }).code ?? "";
    if (code.includes("popup-closed") || code.includes("cancelled-popup")) {
      return { ok: false, code: "POPUP_CLOSED", error: "Sign-in popup was closed." };
    }
    if (code.includes("popup-blocked")) {
      return { ok: false, code: "POPUP_BLOCKED", error: "Your browser blocked the Google sign-in window." };
    }
    if (code.includes("api-key") || code.includes("invalid-api-key") || code.includes("configuration")) {
      return { ok: false, code: "NOT_CONFIGURED", error: "Firebase is not configured. Check .env.local." };
    }
    return { ok: false, code: "UNKNOWN", error: (err as Error).message ?? "Sign-in failed." };
  }

  let res: Response;
  try {
    // Force-refresh so freshly granted custom claims are included.
    const idToken = await user.getIdToken(true);
    res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch {
    await signOut(auth).catch(() => undefined);
    return { ok: false, code: "UNKNOWN", error: "Network error while finishing sign-in. Check your connection and try again." };
  }
  if (res.ok) return { ok: true };

  // Not an admin (or other failure): make sure the browser SDK is signed out too.
  await signOut(auth).catch(() => undefined);
  const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
  if (res.status === 403) {
    return { ok: false, code: "NOT_ADMIN", error: body.error ?? "This Google account is not an administrator." };
  }
  if (res.status === 503) {
    return { ok: false, code: "NOT_CONFIGURED", error: body.error ?? "Server Firebase credentials are missing." };
  }
  return { ok: false, code: "UNKNOWN", error: body.error ?? "Could not create session." };
}

export async function signOutAdmin(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
  try {
    await signOut(getFirebaseAuth());
  } catch {
    // ignore
  }
}
