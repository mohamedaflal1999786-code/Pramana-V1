/**
 * Pramana-V1 - Supabase Browser Client Singleton
 * Team: Unknown GenZ
 *
 * Safe for client-side React components (app router 'use client').
 * Enforces Row-Level Security (RLS) under the caller's session.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { getSupabaseConfigStatus } from "./status";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error(
      "[Pramana-V1 Security] Browser client attempted to execute in a server-side environment."
    );
  }

  if (browserClient) return browserClient;

  const status = getSupabaseConfigStatus();
  if (!status.isConfigured) {
    // Return null or throw clear descriptive error without crashing unconfigured dev views
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )!;

  browserClient = createBrowserClient<Database>(url, anonKey);
  return browserClient;
}

// Re-export getSupabaseConfigStatus for backwards-compatibility
export { getSupabaseConfigStatus };
