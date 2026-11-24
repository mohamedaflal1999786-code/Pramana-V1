/**
 * Pramana-V1 - Supabase Client Foundation
 *
 * Architectural foundation prepared for future phases (Auth, Document Storage, & Database).
 *
 * STRICT AUTHENTICITY NOTICE:
 * In accordance with patient safety and system integrity requirements, no simulated
 * mock databases or fake connections are created here. When valid environment variables
 * are provided in subsequent phases, the verified Supabase client will be initialized.
 */

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  missingVariables: string[];
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing: string[] = [];

  if (!supabaseUrl || supabaseUrl.includes("your-project.supabase.co")) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!supabaseAnonKey || supabaseAnonKey.includes("placeholder")) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    isConfigured: missing.length === 0,
    missingVariables: missing,
  };
}
