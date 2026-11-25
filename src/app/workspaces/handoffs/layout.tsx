import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
export default async function RoleLayout({children}:{children:React.ReactNode}) {
 const client=await createSupabaseServerClient();
 if(!client) redirect("/auth/signin");
 const {data:{user},error}=await client.auth.getUser();
 if(error || !user?.email_confirmed_at) redirect("/auth/signin");
 const admin=getSupabaseAdminClient();
 if(!admin) redirect("/auth/signin");
 const {data:member,error:membershipError}=await admin.from("organization_members").select("is_active,role_id").eq("user_id",user.id).maybeSingle();
 if(membershipError || !member || !member.is_active || !["doctor","pharmacist","institutional_admin","platform_admin"].includes(member.role_id)) redirect("/auth/signin");
 return <>{children}</>;
}
