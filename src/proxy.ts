/**
 * Pramana-V1 - Next.js Edge Middleware Security & Authentication Guard
 * Team: Unknown GenZ
 *
 * Responsibilities:
 * 1. Synchronizes and refreshes Supabase Auth tokens on every request via @supabase/ssr.
 * 2. Enforces Server-Side Access Control for /workspaces/* routes.
 * 3. Applies defense-in-depth HTTP Security Headers (CSP, Anti-Clickjacking, Sniff Guard).
 * 4. Prevents open redirect vulnerabilities on returnUrl parameters.
 */

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require genuine authentication
const PROTECTED_PREFIX = "/workspaces";

// Security headers applied to all responses
const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://dvdhfonmvbhphvrwdlxn.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' https://dvdhfonmvbhphvrwdlxn.supabase.co wss://dvdhfonmvbhphvrwdlxn.supabase.co",
    "frame-ancestors 'none'",
  ].join("; "),
};

/**
 * Validates that a redirect path is internal and safe against open-redirect attacks
 */
function isSafeInternalUrl(url: string | null): boolean {
  if (!url) return false;
  return url.startsWith("/") && !url.startsWith("//") && !url.includes("://");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Session token refresh via Supabase SSR
  const { supabaseResponse, user } = await updateSession(request);

  // Apply HTTP security headers
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    supabaseResponse.headers.set(header, value);
  }

  const redirectWithSession = (url: URL) => {
    const response = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll()) response.cookies.set(cookie);
    for (const [header,value] of Object.entries(SECURITY_HEADERS)) response.headers.set(header,value);
    response.headers.set("Cache-Control","no-store");
    return response;
  };
  // 2. Check if route is under /workspaces
  if (pathname.startsWith(PROTECTED_PREFIX)) {
    if (!user) {
      // Unauthenticated access attempt: Redirect to signin with validated returnUrl
      const returnUrl = isSafeInternalUrl(pathname) ? pathname : "/workspaces/doctor";
      const redirectUrl = new URL("/auth/signin", request.url);
      redirectUrl.searchParams.set("returnUrl", returnUrl);
      return redirectWithSession(redirectUrl);
    }

    // Role and active membership checks are enforced by server workspace layouts.
  }
  // Do not force authenticated users into the doctor portal.
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder images/svgs (.png, .jpg, .svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
