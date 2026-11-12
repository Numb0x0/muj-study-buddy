import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/constants/collections";

/**
 * Cheap first line of defence for /admin: redirect to the login page when no
 * session cookie exists at all. Real verification (signature, revocation,
 * admin claim) happens in the admin layout and in every admin API handler via
 * the Admin SDK — never rely on this alone.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
