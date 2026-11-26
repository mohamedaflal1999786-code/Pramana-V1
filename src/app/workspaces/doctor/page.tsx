"use client";
import {useState} from "react";
import Link from "next/link";
import {WorkspaceLayout} from "@/components/workspace/WorkspaceLayout";
import {startEncounter} from "@/lib/actions/care-actions";
import {CareForm} from "@/components/workspace/CareForm";
import {PatientPicker} from "@/components/workspace/PatientPicker";
export default function DoctorPage(){
  const [patient,setPatient]=useState("");
  const [status,setStatus]=useState("");
  const [revision,setRevision]=useState(0);
  return <WorkspaceLayout activeRole="doctor"><h1>Patient management</h1>
    <CareForm mode="register" onSaved={()=>setRevision(r=>r+1)}/>
    <PatientPicker key={revision} value={patient} onChange={id=>{setPatient(id);setStatus("");}}/>
    {patient && <p><button className="underline" disabled={status==="Saving…"} onClick={async()=>{setStatus("Saving…");try{await startEncounter(patient);setStatus("Encounter opened.");}catch{setStatus("Encounter unavailable.");}}}>Open outpatient encounter</button> <span role="status">{status}</span></p>}
    {patient && <div className="grid gap-4 sm:grid-cols-2">{[["documents","Upload and analyze documents"],["graph","Inspect evidence"],["handoffs","Prepare handoff"],["discharge","Prepare discharge instructions"]].map(([route,title])=><Link className="tile underline" key={route} href={{pathname:"/workspaces/"+route,query:{patient}}}>{title}</Link>)}</div>}
  </WorkspaceLayout>;
}
