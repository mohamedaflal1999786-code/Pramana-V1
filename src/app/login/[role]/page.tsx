import { redirect, notFound } from "next/navigation";
export default async function LoginPortal({params}: {params: Promise<{role:string}>}) {
 const {role}=await params;
 if(!["admin","doctor","pharmacist","patient"].includes(role)) notFound();
 redirect("/auth/signin?portal="+role);
}
