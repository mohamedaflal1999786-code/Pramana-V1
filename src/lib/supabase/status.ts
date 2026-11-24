/**
 * Pramana-V1 - Supabase Configuration & Health Status
 * Team: Unknown GenZ
 *
 * Verifies Supabase credentials safely without leaking secrets or passwords.
 */

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  urlHost?: string;
  missingVariables: string[];
  mode: "connected" | "unconfigured" | "placeholder";
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const missing: string[] = [];

  const isPlaceholderUrl = !url || url.includes("placeholder") || url.includes("your-project");
  const isPlaceholderAnon = !anonKey || anonKey.includes("placeholder") || anonKey.length < 20;
  const isPlaceholderService = !serviceKey || serviceKey.includes("placeholder") || serviceKey.length < 20;

  if (isPlaceholderUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (isPlaceholderAnon) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY / PUBLISHABLE_KEY");
  if (isPlaceholderService) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  let urlHost: string | undefined;
  if (url && !isPlaceholderUrl) {
    try {
      const parsed = new URL(url);
      urlHost = parsed.host;
    } catch {
      urlHost = "invalid-url";
    }
  }

  const isConfigured = !isPlaceholderUrl && !isPlaceholderAnon;
  const mode = isConfigured 
    ? "connected" 
    : (url || anonKey ? "placeholder" : "unconfigured");

  return {
    isConfigured,
    hasUrl: !isPlaceholderUrl,
    hasAnonKey: !isPlaceholderAnon,
    hasServiceRoleKey: !isPlaceholderService,
    urlHost,
    missingVariables: missing,
    mode,
  };
}
