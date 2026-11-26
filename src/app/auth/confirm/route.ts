/**
 * Pramana-V1 - Auth OTP/Token Confirmation Route Handler
 * Team: Unknown GenZ
 *
 * Verifies email tokens sent by Supabase for signup confirmation and recovery.
 */

import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/workspaces/doctor";

  if (token_hash && type) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        const destination = new URL(next, request.url);
        return NextResponse.redirect(destination.origin === request.nextUrl.origin ? destination : new URL("/auth/signin",request.url));
      }
      console.error("[Auth Confirm Error]:", error.message);
    }
  }

  // Token expired or invalid
  const redirectUrl = new URL("/auth/verify-email", request.url);
  redirectUrl.searchParams.set("error", "token_invalid_or_expired");
  return NextResponse.redirect(redirectUrl);
}
