/**
 * Pramana-V1 - Server-Side Session and RBAC Context Helper
 * Team: Unknown GenZ
 *
 * Provides authenticated user profile, active institutional roles, and tenancy context.
 * Never trusts unverified client metadata; queries protected PostgreSQL tables.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database.types";

export interface UserSessionContext {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    avatarUrl?: string | null;
  } | null;
  membership: {
    organizationId: string;
    organizationName: string;
    roleId: UserRole;
    department?: string | null;
    isActive: boolean;
  } | null;
  accountStatus: "pending" | "approved" | "rejected" | "suspended" | "unregistered";
  mfaEnrolled: boolean;
  aalLevel: "aal1" | "aal2";
}

export async function getServerSessionContext(): Promise<UserSessionContext> {
  const fallback: UserSessionContext = {
    isAuthenticated: false,
    user: null,
    membership: null,
    accountStatus: "unregistered",
    mfaEnrolled: false,
    aalLevel: "aal1",
  };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fallback;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.id) return fallback;

  const admin = getSupabaseAdminClient();
  if (!admin) return fallback;

  // 1. Fetch Profile
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Fetch Active Organization Membership
  const { data: member } = await admin
    .from("organization_members")
    .select("*, organizations(id, name)")
    .eq("user_id", user.id)
    .maybeSingle();

  // 3. Check MFA Assurance Level
  const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const aalLevel = mfaData?.currentLevel === "aal2" ? "aal2" : "aal1";
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const mfaEnrolled = (factors?.totp?.length ?? 0) > 0;

  // Compute account status
  let accountStatus: UserSessionContext["accountStatus"] = "pending";
  if (!member) {
    accountStatus = "pending";
  } else if (!member.is_active) {
    accountStatus = "suspended";
  } else {
    accountStatus = "approved";
  }

  const orgName = (member as any)?.organizations?.name || "Pramana Academic Health System";
  const orgId = member?.organization_id || "00000000-0000-0000-0000-000000000001";

  return {
    isAuthenticated: true,
    user: {
      id: user.id,
      email: user.email || profile?.email || "",
      fullName:
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Professional Reviewer",
      phone: profile?.phone,
      avatarUrl: profile?.avatar_url,
    },
    membership: member
      ? {
          organizationId: orgId,
          organizationName: orgName,
          roleId: (member.role_id as UserRole) || "doctor",
          department: member.department,
          isActive: member.is_active,
        }
      : null,
    accountStatus,
    mfaEnrolled,
    aalLevel,
  };
}
