import { getSupabaseAdminClient } from "../src/lib/supabase/admin";
export async function updateAdminPassword() {
  const admin=getSupabaseAdminClient();
  const id=process.env.PRAMANA_ADMIN_USER_ID;
  const password=process.env.PRAMANA_NEW_ADMIN_PASSWORD;
  if(!admin || !id || !password || password.length<12) throw new Error("Target account and secure runtime password are required.");
  const {data}=await admin.from("organization_members").select("role_id,is_active").eq("user_id",id).single();
  if(!data?.is_active || !["platform_admin","institutional_admin"].includes(data.role_id)) throw new Error("Target is not an active administrator.");
  const {error}=await admin.auth.admin.updateUserById(id,{password});
  if(error) throw new Error("Password update failed.");
}
if (require.main===module) updateAdminPassword().catch(()=>{console.error("Administrator password update failed.");process.exitCode=1;});
