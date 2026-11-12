import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/constants/collections";
import type { AdminSession } from "@/types/auth";
import { verifySessionCookieValue } from "./session";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Guard for admin route handlers. Resolves to the admin session or throws an
 * HttpError(401/403) which `withAdmin` converts into a JSON response.
 */
/**
 * Defence in depth against CSRF on top of SameSite=Lax cookies: browsers send
 * an Origin header on cross-site POST/PATCH/PUT/DELETE; reject mismatches.
 */
function assertSameOrigin(req: NextRequest) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return;
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients (scripts, tests) don't send Origin
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origin).host === host) return;
  } catch {
    /* fall through */
  }
  throw new HttpError(403, "Cross-site request blocked.", "BAD_ORIGIN");
}

export async function requireAdmin(req: NextRequest): Promise<AdminSession> {
  assertSameOrigin(req);
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) throw new HttpError(401, "Not signed in.", "UNAUTHENTICATED");
  const session = await verifySessionCookieValue(cookie);
  if (!session) throw new HttpError(403, "Admin privileges required.", "FORBIDDEN");
  return session;
}

type Ctx<P> = { params: Promise<P> };
type Handler<P> = (req: NextRequest, ctx: { params: P; session: AdminSession }) => Promise<Response>;

/**
 * Wrap an admin route handler: verifies the session, resolves async params,
 * and converts thrown HttpError / ZodError / unknown errors into JSON.
 *
 *   export const POST = withAdmin<{ id: string }>(async (req, { params, session }) => { ... })
 */
export function withAdmin<P extends Record<string, string> = Record<string, never>>(handler: Handler<P>) {
  return async (req: NextRequest, ctx: Ctx<P>): Promise<Response> => {
    try {
      const session = await requireAdmin(req);
      const params = (await ctx?.params) ?? ({} as P);
      return await handler(req, { params, session });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Same as withAdmin but for public handlers: only error normalisation. */
export function withPublic<P extends Record<string, string> = Record<string, never>>(
  handler: (req: NextRequest, ctx: { params: P }) => Promise<Response>,
) {
  return async (req: NextRequest, ctx: Ctx<P>): Promise<Response> => {
    try {
      const params = (await ctx?.params) ?? ({} as P);
      return await handler(req, { params });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message, code: err.code, details: err.details }, { status: err.status });
  }
  // zod v4 errors expose `issues`
  if (err && typeof err === "object" && "issues" in err && Array.isArray((err as { issues: unknown[] }).issues)) {
    const issues = (err as { issues: { path: PropertyKey[]; message: string }[] }).issues;
    return NextResponse.json(
      { error: "Validation failed.", code: "VALIDATION", details: issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 400 },
    );
  }
  const status = err instanceof Error && err.name === "AdminConfigError" ? 503 : 500;
  console.error("[api]", err);
  // Never echo internal SDK messages (paths, index URLs, project ids) to clients in production.
  const message = process.env.NODE_ENV === "production" ? (status === 503 ? "Service not configured." : "Unexpected server error.") : err instanceof Error ? err.message : "Unexpected server error.";
  return NextResponse.json({ error: message, code: status === 503 ? "NOT_CONFIGURED" : "INTERNAL" }, { status });
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
