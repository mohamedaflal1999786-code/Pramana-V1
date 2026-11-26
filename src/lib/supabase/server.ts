/**
 * Pramana-V1 - Supabase Server Client
 * Team: Unknown GenZ
 *
 * For Server Components, Server Actions, and Route Handlers.
 * Synchronizes authentication sessions via Next.js cookies.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { getSupabaseConfigStatus } from "./status";

export async function createSupabaseServerClient() {
  const status = getSupabaseConfigStatus();
  if (!status.isConfigured) {
    return null;
  }

  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )!;

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // The `delete` method was called from a Server Component.
        }
      },
    },
  });
}
