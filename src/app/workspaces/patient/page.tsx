import { getServerSessionContext } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";

export default async function PatientPage() {
  const session = await getServerSessionContext();
  const admin = getSupabaseAdminClient();
  if (!admin || !session.user || session.accountStatus !== "approved" || session.membership?.roleId !== "patient") throw new Error("Patient access unavailable.");
  const org = session.membership.organizationId;
  const link = await admin.from("patient_account_links").select("patient_id").eq("organization_id",org).eq("user_id",session.user.id).maybeSingle();
  if (link.error) throw new Error("Patient identity service unavailable.");
  const {data:plans,error} = link.data ? await admin.from("discharge_translations")
    .select("id,language_code,translated_content,approved_at,discharge_instructions!inner(patient_id,organization_id,is_verified)")
    .eq("organization_id",org).eq("discharge_instructions.organization_id",org).eq("discharge_instructions.patient_id",link.data.patient_id)
    .eq("discharge_instructions.is_verified",true).eq("is_professionally_approved",true).order("approved_at",{ascending:false}) : {data:[],error:null};
  if (error) throw new Error("Approved instructions unavailable.");
  return <WorkspaceLayout activeRole="patient"><h1>Your discharge instructions</h1>
    {!link.data ? <p>Your care team must verify and link your patient record.</p> : !plans?.length ? <p>No approved instructions yet.</p> :
      plans.map(plan=><article className="tile" key={plan.id}><h2>Approved instructions · {plan.language_code}</h2><p className="whitespace-pre-wrap" lang={plan.language_code}>{String((plan.translated_content as {instructions?:string})?.instructions ?? "")}</p></article>)}
  </WorkspaceLayout>;
}
