"use client";
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Stethoscope, Pill, HeartPulse, ArrowLeft } from "lucide-react";
import { signInAction } from "@/lib/auth/actions";
const portals = {
 admin:{title:"Administrator",description:"Institutional governance, account approvals and oversight.",Icon:ShieldCheck},
 doctor:{title:"Doctor",description:"Clinical evidence, patient records and safety review.",Icon:Stethoscope},
 pharmacist:{title:"Pharmacist",description:"Medication reconciliation and safety verification.",Icon:Pill},
 patient:{title:"Patient",description:"Your authorized health information and care guidance.",Icon:HeartPulse}
};
export default function LoginPortal({params}:{params:{role:string}}){
 const [busy,setBusy]=React.useState(false);
 const [error,setError]=React.useState("");
 const role=params.role as keyof typeof portals;
 const portal=portals[role];
 if(!portal) notFound();
 const Icon=portal.Icon;
 async function submit(e:React.FormEvent<HTMLFormElement>){
 e.preventDefault();setBusy(true);setError("");
 const data=new FormData(e.currentTarget);data.set("portal",role);
 try{const result=await signInAction(data);if(result.success&&result.redirectUrl){window.location.assign(result.redirectUrl);return;}setError(result.error||"Unable to sign in.");}catch{setError("Sign-in unavailable. Please retry.");}finally{setBusy(false);}
 }
 return <main className="min-h-screen bg-[#f6f8f5] text-[#17392f] grid lg:grid-cols-2">
 <section className="bg-[#123c32] text-white p-10 lg:p-20 flex flex-col justify-between min-h-[280px]"><Link href="/" className="font-bold tracking-widest text-white">PRAMANA-V1</Link><div className="py-12"><Icon className="w-14 h-14 mb-8"/><p className="uppercase tracking-widest text-sm text-[#b9d7c8]">Secure clinical workspace</p><h1 className="text-4xl lg:text-6xl font-semibold text-white">{portal.title} portal.</h1><p className="text-lg text-[#d6e9df] max-w-md">{portal.description}</p></div><p className="text-sm text-[#b9d7c8]">Research platform · Authorized access only</p></section>
 <section className="flex items-center justify-center p-6 lg:p-16"><div className="w-full max-w-md"><Link href="/auth/signin" className="flex items-center gap-2 text-sm mb-10"><ArrowLeft className="w-4 h-4"/> All workspaces</Link><h2 className="text-3xl font-bold">{portal.title} sign in</h2><p className="text-sm text-[#52675f] mb-8">Enter your verified account credentials.</p><form onSubmit={submit} className="space-y-5">{error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}<label className="block text-sm font-semibold">Email address<input name="email" type="email" autoComplete="email" required className="mt-2 block w-full rounded-xl border border-[#ccd8d1] bg-white p-4"/></label><label className="block text-sm font-semibold">Password<input name="password" type="password" autoComplete="current-password" required className="mt-2 block w-full rounded-xl border border-[#ccd8d1] bg-white p-4"/></label><Link href="/auth/forgot-password" className="block text-right text-sm underline">Forgot password?</Link><button disabled={busy} className="w-full rounded-xl bg-[#145a45] text-white p-4 font-semibold disabled:opacity-50">{busy?"Signing in…":"Sign in securely"}</button></form>{role!=="admin"&&<p className="mt-6 text-sm">New account? <Link href="/auth/signup" className="underline font-semibold">Request access</Link>. Administrator approval required.</p>}</div></section></main>;
}
