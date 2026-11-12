import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/constants/collections";
import { errorResponse, HttpError } from "@/lib/auth/require-admin";
import { createSessionCookie, sessionCookieOptions, toAdminSession, verifyAdminIdToken, verifySessionCookieValue } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/queries/audit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ idToken: z.string().min(20).max(8192) });

/** POST { idToken } → verify admin claim → set httpOnly session cookie. */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = bodySchema.parse(await req.json().catch(() => ({})));
    let decoded;
    try {
      decoded = await verifyAdminIdToken(idToken);
    } catch (err) {
      if (err instanceof Error && err.name === "NotAdminError") throw new HttpError(403, "This Google account is not an administrator.", "NOT_ADMIN");
      if (err instanceof Error && err.name === "AdminConfigError") throw err;
      throw new HttpError(401, "Sign-in could not be verified. Please try again.", "INVALID_TOKEN");
    }
    // Session cookies may only be minted from a recent sign-in.
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) throw new HttpError(401, "Please sign in again.", "STALE_LOGIN");

    const { value, maxAgeSeconds } = await createSessionCookie(idToken);
    const user = toAdminSession(decoded);
    await writeAuditLog(user, "auth.login", "auth", user.uid);
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set({ ...sessionCookieOptions(maxAgeSeconds), value });
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}

/** GET → current admin session (or null). */
export async function GET(req: NextRequest) {
  try {
    const user = await verifySessionCookieValue(req.cookies.get(SESSION_COOKIE)?.value);
    return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE → clear the cookie. */
export async function DELETE(req: NextRequest) {
  const user = await verifySessionCookieValue(req.cookies.get(SESSION_COOKIE)?.value).catch(() => null);
  if (user) await writeAuditLog(user, "auth.logout", "auth", user.uid);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ ...sessionCookieOptions(0), value: "" });
  return res;
}
