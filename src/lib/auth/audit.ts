/**
 * Pramana-V1 - Protected Audit Logging Service
 * Team: Unknown GenZ
 *
 * Strictly adheres to healthcare security principles:
 * - Records auth events, account approvals, privilege escalations, and access attempts.
 * - NEVER logs passwords, OTP codes, session tokens, or patient health information (PHI).
 * - Appends to the immutable audit_logs database table.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "auth.login_success"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.signup_requested"
  | "auth.password_reset_requested"
  | "auth.password_reset_completed"
  | "auth.mfa_enrolled"
  | "auth.mfa_verified"
  | "auth.mfa_disabled"
  | "account.approved"
  | "account.rejected"
  | "account.suspended"
  | "rbac.role_assigned"
  | "rbac.role_revoked"
  | "security.unauthorized_access_attempt"
  | "security.privilege_escalation_blocked"
  | "spg.evidence_invalidated"
  | "spg.simulation_executed"
  | "spg.finding_reviewed";

export interface LogAuditEventParams {
  action: AuditAction;
  userId?: string | null;
  organizationId?: string | null;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Strips any sensitive fields before audit persistence
 */
function sanitizeDetails(details?: Record<string, any>): Record<string, any> {
  if (!details) return {};
  const sanitized = { ...details };
  const sensitiveKeys = [
    "password",
    "password_hash",
    "token",
    "access_token",
    "refresh_token",
    "secret",
    "otp",
    "code",
    "ssn",
    "mrn",
  ];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = "[REDACTED_SECURITY_DATA]";
    }
  }
  return sanitized;
}

export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  try {
    const admin = getSupabaseAdminClient();
    if (!admin) {
      console.warn("[Audit Trail] Admin client unavailable for audit persistence.");
      return;
    }

    const sanitized = sanitizeDetails(params.details);
    if (params.ipAddress) {
      sanitized.ip = params.ipAddress;
    }
    if (params.userId) {
      sanitized.user_id = params.userId;
    }

    const isValidUuid = (val?: string | null) =>
      typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const targetEntityId = isValidUuid(params.entityId)
      ? params.entityId
      : isValidUuid(params.userId)
      ? params.userId
      : null;

    const { error } = await admin.from("audit_logs").insert({
      organization_id: params.organizationId || "00000000-0000-0000-0000-000000000001",
      action: params.action,
      entity_type: params.entityType || "auth_session",
      entity_id: targetEntityId,
      details: sanitized,
    });

    if (error) {
      console.error("[Audit Trail Error] Failed to insert audit record:", error.message);
    }
  } catch (err: any) {
    console.error("[Audit Trail System Error]:", err?.message || err);
  }
}
