/**
 * Pramana-V1 - Supabase Isolated Server-Side Admin Client
 * Team: Unknown GenZ
 *
 * PRIVILEGED SERVICE-ROLE CLIENT:
 * - Strictly isolated to secure server-side execution.
 * - Bypasses Row Level Security (RLS) for platform auditing and system tasks.
 * - NEVER import into client components or expose to the browser bundle.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSupabaseConfigStatus } from "./status";

export function getSupabaseAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "[Pramana-V1 CRITICAL SECURITY ALERT] Attempted to instantiate Supabase Admin Client in a browser environment!"
    );
  }

  const status = getSupabaseConfigStatus();
  if (!status.hasServiceRoleKey || !status.hasUrl) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
