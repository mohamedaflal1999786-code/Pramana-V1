"use client";
import { useState,useEffect } from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PatientPicker } from "@/components/workspace/PatientPicker";
import { listEncounterSources } from "@/lib/actions/care-actions";
import { runHandoffAiAnalysisAction } from "@/lib/actions/ai-actions";
import type { HandoffOmissionItem } from "@/lib/ai/types";

export default function Handoffs() {
  const [patient,setPatient]=useState("");
  return <WorkspaceLayout pageTitle="Clinical handoffs"><h1>Clinical handoff review</h1><PatientPicker value={patient} onChange={setPatient}/>{patient && <Handoff key={patient} patient={patient}/>}</WorkspaceLayout>;
}
function Handoff({patient}:{patient:string}) {
  const [sources,setSources]=useState<Awaited<ReturnType<typeof listEncounterSources>>>();
  const [id,setId]=useState("");const [note,setNote]=useState("");
  const [status,setStatus]=useState("");const [busy,setBusy]=useState(false);
  const [items,setItems]=useState<HandoffOmissionItem[]>([]);
  useEffect(()=>{listEncounterSources(patient).then(setSources).catch(()=>setStatus("Encounter directory unavailable."));},[patient]);
  const options=sources?.documents.filter(d=>sources.encounters.some(e=>e.id===d.encounter_id));
  return <form className="tile grid gap-3" onSubmit={async e=>{
    e.preventDefault();const doc=options?.find(d=>d.id===id);if (!doc?.encounter_id) return;
    setItems([]);setBusy(true);setStatus("");
    try {const res=await runHandoffAiAnalysisAction(doc.encounter_id,note,id);setItems(res.omissions);setStatus(res.omissions.length?"Review the cited passages.":"Analysis returned no omissions. Professional review is required.");}
    catch {setStatus("Analysis unavailable. Check the linked source and retry.");}finally {setBusy(false);}
  }}>
    <label>Encounter and source document<select className="block w-full border p-2" required disabled={busy} value={id} onChange={e=>{setId(e.target.value);setItems([]);setStatus("");}}>
      <option value="">{sources && !options?.length?"No linked encounter documents":"Select source"}</option>
      {options?.map(d=><option key={d.id} value={d.id}>{sources?.encounters.find(e=>e.id===d.encounter_id)?.encounter_number} · {d.title}</option>)}
    </select></label>
    <label>Outgoing handoff summary<textarea required disabled={busy} className="block w-full border p-2" maxLength={16000} value={note} onChange={e=>{setNote(e.target.value);setItems([]);setStatus("");}}/></label>
    <button disabled={busy || !id}>{busy?"Analyzing…":"Compare with source"}</button><p role="status">{status}</p>
    {items.map(i=><article key={i.id}><strong>{i.item}</strong><blockquote>{i.sourceEvidence.rawQuote}</blockquote></article>)}
  </form>;
}
