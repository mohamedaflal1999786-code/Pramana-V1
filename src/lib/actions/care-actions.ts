"use server";
import { getServerSessionContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assignedPatientIds, requireClinicalMember, requirePatient } from "@/lib/care/access";

export async function listAssignedPatients() {
  const ctx = await requireClinicalMember();
  const ids = await assignedPatientIds(ctx);
  if (!ids.length) return [];
  const { data, error } = await ctx.admin.from("patients").select("id,mrn")
    .eq("organization_id",ctx.member.organization_id).in("id",ids).order("mrn");
  if (error) throw new Error("Patient directory unavailable.");
  return data;
}

export async function registerPatient(form: FormData) {
  const { member, client } = await requireClinicalMember();
  const { error } = await client.rpc("register_care_patient", {
    p_org: member.organization_id, p_first: String(form.get("first") ?? ""),
    p_last: String(form.get("last") ?? ""), p_birth: String(form.get("birth") ?? ""),
    p_consent: form.get("consent") === "on",
  });
  if (error) throw new Error("Registration could not be saved.");
}

export async function assignPatientAccount(form:FormData) {
  const context = await getServerSessionContext();
  const client = await createSupabaseServerClient();
  if (!client || !context.membership || context.accountStatus!=="approved") throw new Error("Administrator required.");
  const {error} = await client.rpc("assign_care_access",{p_org:context.membership.organizationId,p_mrn:String(form.get("mrn") ?? "").trim(),p_account:String(form.get("account") ?? "").trim(),p_identity_verified:form.get("verified")==="on"});
  if (error) throw new Error("Assignment could not be verified or already exists.");
}

export async function listEncounterSources(patientId:string) {
  const {admin,org} = await requirePatient(patientId);
  const [encounters,documents] = await Promise.all([
    admin.from("encounters").select("id,encounter_number").eq("organization_id",org).eq("patient_id",patientId),
    admin.from("clinical_documents").select("id,title,encounter_id").eq("organization_id",org).eq("patient_id",patientId).eq("quarantine_status","validated")
  ]);
  if (encounters.error || documents.error) throw new Error("Encounter directory unavailable.");
  return { encounters:encounters.data, documents:documents.data };
}

export async function getMedicationRecord(patientId:string) {
  const {admin,org}=await requirePatient(patientId);
  const [meds,allergies,alerts]=await Promise.all([
    admin.from("medications").select("id,drug_name,dose,frequency,route,status").eq("organization_id",org).eq("patient_id",patientId),
    admin.from("allergies").select("id,allergen,reaction,severity").eq("organization_id",org).eq("patient_id",patientId),
    admin.from("safety_alerts").select("id,title,summary,status").eq("organization_id",org).eq("patient_id",patientId)
  ]);
  if(meds.error || allergies.error || alerts.error) throw new Error("Patient medication data unavailable.");
  return {medications:meds.data,allergies:allergies.data,alerts:alerts.data};
}

export async function workspaceIdentity() {
  const session=await getServerSessionContext();
  if(!session.user || !session.membership || session.accountStatus!=="approved") throw new Error("Membership unavailable.");
  return {fullName:session.user.fullName,email:session.user.email,role:session.membership.roleId,institution:session.membership.organizationName};
}

export async function startEncounter(patientId:string) {
  const {admin,org,member}=await requirePatient(patientId);
  if (member.role_id!=="doctor") throw new Error("Doctor access required.");
  const {error}=await admin.from("encounters").insert({organization_id:org,patient_id:patientId,encounter_number:"ENC-"+crypto.randomUUID(),encounter_type:"outpatient",admission_date:new Date().toISOString()});
  if (error) throw new Error("Encounter could not be created.");
}

export async function pendingDischarges(patientId:string) {
  const {admin,org,member}=await requirePatient(patientId);
  if(member.role_id!=="doctor") throw new Error("Doctor access required.");
  const {data,error}=await admin.from("discharge_translations")
    .select("id,language_code,translated_content,discharge_instructions!inner(patient_id,organization_id,source_instructions)")
    .eq("organization_id",org).eq("discharge_instructions.organization_id",org).eq("discharge_instructions.patient_id",patientId)
    .eq("is_professionally_approved",false).order("created_at",{ascending:false});
  if(error) throw new Error("Saved drafts unavailable.");
  return data.map(row=>({id:row.id,language:row.language_code,source:String((row.discharge_instructions as unknown as {source_instructions:string}).source_instructions || ""),translation:String((row.translated_content as {instructions?:string})?.instructions || "")}));
}
