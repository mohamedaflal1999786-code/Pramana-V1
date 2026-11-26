import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function requireClinicalMember() {
  const client = await createSupabaseServerClient();
  const admin = getSupabaseAdminClient();
  if (!client || !admin) throw new Error("Clinical services unavailable.");
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user?.email_confirmed_at) throw new Error("Verified account required.");
  const { data: member } = await admin.from("organization_members")
    .select("organization_id,role_id,is_active").eq("user_id", user.id).maybeSingle();
  if (!member?.is_active || !["doctor","pharmacist"].includes(member.role_id)) throw new Error("Clinical access denied.");
  return { client, admin, member, user };
}

export async function assignedPatientIds(context: Awaited<ReturnType<typeof requireClinicalMember>>) {
  const { client, member, user } = context;
  const { data, error } = await client.from("patient_care_access").select("patient_id")
    .eq("organization_id", member.organization_id).eq("user_id", user.id);
  if (error) throw new Error("Patient assignments unavailable.");
  return data.map(row => row.patient_id);
}

export async function requirePatient(patientId?: string) {
  const context = await requireClinicalMember();
  if (!patientId || !(await assignedPatientIds(context)).includes(patientId)) throw new Error("Select an assigned patient.");
  return { ...context, patientId, org: context.member.organization_id };
}
