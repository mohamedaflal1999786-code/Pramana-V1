import { redirect, notFound } from "next/navigation";
import Link from "next/link";
export default async function LoginPortal({params}: {params: Promise<{role:string}>}) {
 const {role}=await params;
 if(role==="public") return <main className="mx-auto max-w-xl p-10"><h1 className="text-3xl font-bold text-[#145a45]">PRAMANA-V1 Public Portal</h1><p className="my-5">Explore our research platform without accessing confidential clinical records. Public browsing does not require an account.</p><Link href="/" className="underline">Explore platform</Link><br/><Link href="/auth/signin" className="underline">Choose a clinical workspace</Link></main>;
 if(!["admin","doctor","pharmacist","patient"].includes(role)) notFound();
 redirect("/auth/signin?portal="+role);
}
