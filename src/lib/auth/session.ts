import "server-only";

/**
 * Admin session handling (server only).
 *
 * Flow:
 *   browser: Google sign-in via Firebase Auth → ID token
 *   POST /api/auth/session { idToken }  → verifyIdToken → require claims.admin === true
 *                                        → createSessionCookie → Set-Cookie (__session, httpOnly)
 *   every admin page / API: getAdminSession() → verifySessionCookie(checkRevoked) → claims.admin
 *
 * Google sign-in alone never grants admin. Only `scripts/set-admin-claim.ts`
 * (Admin SDK, run by the project owner) can set the custom claim.
 */
import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE, SESSION_DURATION_MS } from "@/constants/collections";
import type { AdminSession } from "@/types/auth";

export function isAdminClaims(decoded: DecodedIdToken | null | undefined): boolean {
  return Boolean(decoded && decoded.admin === true);
}

export function toAdminSession(decoded: DecodedIdToken): AdminSession {
  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    name: (decoded.name as string | undefined) ?? null,
    picture: (decoded.picture as string | undefined) ?? null,
    exp: decoded.exp,
  };
}

/** Verify an ID token from the browser and confirm admin claim. Throws on failure. */
export async function verifyAdminIdToken(idToken: string): Promise<DecodedIdToken> {
  const decoded = await adminAuth().verifyIdToken(idToken, true);
  if (!isAdminClaims(decoded)) {
    const err = new Error("This Google account is not an administrator.");
    err.name = "NotAdminError";
    throw err;
  }
  return decoded;
}

/** Mint a session cookie string (caller sets it on the response). */
export async function createSessionCookie(idToken: string): Promise<{ value: string; maxAgeSeconds: number }> {
  const value = await adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_DURATION_MS });
  return { value, maxAgeSeconds: Math.floor(SESSION_DURATION_MS / 1000) };
}

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Read + verify the session cookie. Returns null when absent, invalid, revoked, or not admin. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    if (!isAdminClaims(decoded)) return null;
    return toAdminSession(decoded);
  } catch {
    return null;
  }
}

/** Verify a raw cookie value (for route handlers that already have the request). */
export async function verifySessionCookieValue(cookie: string | undefined): Promise<AdminSession | null> {
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    if (!isAdminClaims(decoded)) return null;
    return toAdminSession(decoded);
  } catch {
    return null;
  }
}
