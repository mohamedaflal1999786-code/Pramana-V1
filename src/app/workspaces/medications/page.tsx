"use client";
import {useState,useEffect} from "react";
import Link from "next/link";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PatientPicker } from "@/components/workspace/PatientPicker";
import { getMedicationRecord } from "@/lib/actions/care-actions";
export default function MedicationPage(){
  const [patient,setPatient]=useState("");
  return <WorkspaceLayout pageTitle="Medication safety"><h1>Medication reconciliation</h1><PatientPicker value={patient} onChange={setPatient}/>{patient && <MedicationRecord key={patient} patient={patient}/>}</WorkspaceLayout>;
}
function MedicationRecord({patient}:{patient:string}){
  const [record,setRecord]=useState<Awaited<ReturnType<typeof getMedicationRecord>>>();
  const [error,setError]=useState(false);
  useEffect(()=>{getMedicationRecord(patient).then(setRecord).catch(()=>setError(true));},[patient]);
  if (!record) return <p role="status">{error?"Medication records unavailable.":"Loading patient record…"}</p>;
  return <div className="grid gap-4"><section className="tile"><h2>Documented medications</h2>
    {record.medications.length===0 && <p>No medication records available.</p>}
    {record.medications.map(m=><p key={m.id}><strong>{m.drug_name}</strong> · {m.dose || "Dose undocumented"} · {m.frequency || "Frequency undocumented"} · {m.status}</p>)}</section>
    <section className="tile"><h2>Allergy history</h2>{!record.allergies.length && <p>No allergy history recorded.</p>}
    {record.allergies.map(a=><p key={a.id}>{a.allergen} · {a.reaction || "Reaction undocumented"}</p>)}</section>
    <section className="tile"><h2>Recorded safety alerts</h2>{!record.alerts.length && <p>No recorded alerts. Medication review is still required.</p>}
    {record.alerts.map(a=><p key={a.id}><strong>{a.title}</strong> · {a.status}<br/>{a.summary}</p>)}
    <Link className="underline" href="/workspaces/review">Open professional review queue</Link></section></div>;
}
