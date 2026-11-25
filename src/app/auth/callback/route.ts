/**
 * Pramana-V1 - Auth Code Exchange Route Handler (PKCE)
 * Team: Unknown GenZ
 *
 * Exchanges the temporary auth code received from email verification,
 * magic link, or OAuth provider for an authenticated Supabase SSR session.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/workspaces/doctor";

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Safe internal redirect
        const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/workspaces/doctor";
        return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
      }
      console.error("[Auth Callback Error] Code exchange failed:", error.message);
    }
  }

  // If code is missing or exchange failed, redirect to signin with error notification
  const errorUrl = new URL("/auth/signin", requestUrl.origin);
  errorUrl.searchParams.set("error", "verification_expired");
  return NextResponse.redirect(errorUrl);
}
