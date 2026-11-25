/**
 * Pramana-V1 - Institutional Administration & Account Governance
 * Team: Unknown GenZ
 *
 * Provides privileged administrative operations:
 * - Review and approve pending clinical registrations
 * - Reject or suspend unauthorized accounts
 * - Role reassignment
 * - Audit logging of all institutional governance actions
 */

"use server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/auth/audit";
import type { UserRole } from "@/types/database.types";

export interface PendingAccountItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  requestedRole: UserRole;
  department: string | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * Fetch all pending and registered institutional accounts
 */
export async function listInstitutionalAccountsAction(organizationId?: string): Promise<PendingAccountItem[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const admin = getSupabaseAdminClient();
  if (!admin) return [];

  // Verify caller is an administrator
  const { data: callerMember } = await admin
    .from("organization_members")
    .select("role_id, organization_id, is_active")
    .eq("user_id", user.id)
    .single();

  const isCallerAdmin = callerMember?.is_active && (callerMember.role_id === "institutional_admin" || callerMember.role_id === "platform_admin");

  if (!isCallerAdmin) {
    console.warn("[Admin Security Alert] Unauthorized attempt to list accounts by user:", user.id);
    return [];
  }

  const orgId = callerMember!.organization_id;
  if (organizationId && organizationId !== orgId) return [];

  const { data: members, error } = await admin
    .from("organization_members")
    .select(`
      id,
      user_id,
      role_id,
      department,
      is_active,
      created_at,
      profiles (
        full_name,
        email
      )
    `)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error || !members) return [];

  return members.map((m: any) => ({
    id: m.id,
    userId: m.user_id,
    fullName: m.profiles?.full_name || "Unknown Professional",
    email: m.profiles?.email || "unknown@hospital.org",
    requestedRole: m.role_id,
    department: m.department,
    isActive: m.is_active,
    createdAt: m.created_at,
  }));
}

/**
 * Approve a pending professional account
 */
export async function approveAccountAction(
  targetUserId: string,
  assignedRole?: UserRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: "Auth service unavailable." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Authentication required." };

  // Prohibit self-approval
  if (user.id === targetUserId) {
    return { success: false, error: "Self-approval is strictly forbidden under institutional governance rules." };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return { success: false, error: "Admin client unavailable." };

  // Check caller role
  const { data: callerMember } = await admin
    .from("organization_members")
    .select("role_id, organization_id, is_active")
    .eq("user_id", user.id)
    .single();

  if (
    !callerMember?.is_active || (callerMember.role_id !== "institutional_admin" && callerMember.role_id !== "platform_admin")
  ) {
    return { success: false, error: "Administrator privileges required to approve accounts." };
  }

  const { data: target } = await admin.from("organization_members").select("role_id").eq("user_id",targetUserId).eq("organization_id",callerMember!.organization_id).maybeSingle();
  if (!target || !["doctor","pharmacist","patient"].includes(target.role_id) || (assignedRole && assignedRole !== target.role_id)) return {success:false,error:"Invalid account or role."};
  const updatePayload: Record<string, any> = { is_active: true };
  if (assignedRole) {
    updatePayload.role_id = assignedRole;
  }

  const { error } = await admin
    .from("organization_members")
    .update(updatePayload)
    .eq("user_id", targetUserId).eq("organization_id",callerMember!.organization_id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Update Supabase Auth app_metadata so JWT reflects approved state
  await admin.auth.admin.updateUserById(targetUserId, {
    app_metadata: { role: target.role_id, is_active: true },
  });

  await logAuditEvent({
    action: "account.approved",
    userId: user.id,
    entityType: "organization_members",
    entityId: targetUserId,
    details: {
      target_user_id: targetUserId,
      approved_by: user.id,
      assigned_role: assignedRole,
    },
  });

  return { success: true };
}

/**
 * Suspend an account
 */
export async function suspendAccountAction(
  targetUserId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: "Auth service unavailable." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Authentication required." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { success: false, error: "Admin client unavailable." };

  const { data: callerMember } = await admin.from("organization_members").select("role_id,organization_id,is_active").eq("user_id",user.id).maybeSingle();
  if (!callerMember?.is_active || !["institutional_admin","platform_admin"].includes(callerMember.role_id) || user.id === targetUserId) return {success:false,error:"Administrator privileges required."};
  const { data: target } = await admin.from("organization_members").select("role_id").eq("user_id",targetUserId).eq("organization_id",callerMember.organization_id).maybeSingle();
  if (!target || !["doctor","pharmacist","patient"].includes(target.role_id)) return {success:false,error:"Invalid target account."};
  const { error } = await admin
    .from("organization_members")
    .update({ is_active: false })
    .eq("user_id", targetUserId).eq("organization_id",callerMember!.organization_id);

  if (error) {
    return { success: false, error: error.message };
  }

  await admin.auth.admin.updateUserById(targetUserId, {
    app_metadata: { is_active: false },
  });

  await logAuditEvent({
    action: "account.suspended",
    userId: user.id,
    entityType: "organization_members",
    entityId: targetUserId,
    details: {
      target_user_id: targetUserId,
      suspended_by: user.id,
      reason: reason || "Administrative suspension",
    },
  });

  return { success: true };
}
