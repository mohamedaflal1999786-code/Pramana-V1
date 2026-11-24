/**
 * Pramana-V1 Audit Trail Service
 * Team: Unknown GenZ
 *
 * Implements server-side append-only audit logging.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import type { Database, Json } from "@/types/database.types";

export type AuditLogInput = {
  organizationId?: string | null;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Json;
  clientIp?: string | null;
  userAgent?: string | null;
};

export async function recordAuditEvent(event: AuditLogInput): Promise<{
  success: boolean;
  logId?: string;
  persisted: boolean;
}> {
  const status = getSupabaseConfigStatus();

  if (status.isConfigured && status.hasServiceRoleKey) {
    try {
      const adminClient = getSupabaseAdminClient();
      if (adminClient) {
        const { data, error } = await adminClient
          .from("audit_logs")
          .insert({
            organization_id: event.organizationId || null,
            actor_id: event.actorId || null,
            action: event.action,
            entity_type: event.entityType,
            entity_id: event.entityId || null,
            details: event.details || {},
            client_ip: event.clientIp || null,
            user_agent: event.userAgent ? event.userAgent.substring(0, 255) : null,
          })
          .select("id")
          .single();

        if (error) {
          console.error("[Pramana-V1 Audit Service] Failed to write audit log:", error.message);
          return { success: false, persisted: false };
        }

        return { success: true, logId: data.id, persisted: true };
      }
    } catch (err) {
      console.error("[Pramana-V1 Audit Service] Error writing audit log:", err);
      return { success: false, persisted: false };
    }
  }

  // Fallback: log to console during unconfigured local development
  return { success: true, persisted: false };
}
