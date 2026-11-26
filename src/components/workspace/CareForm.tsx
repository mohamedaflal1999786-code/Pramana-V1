"use client";
import { useState } from "react";
import { registerPatient,assignPatientAccount } from "@/lib/actions/care-actions";
export function CareForm({mode,onSaved}:{mode:"register"|"assign";onSaved?:()=>void}) {
  const [status,setStatus]=useState("");
  const [busy,setBusy]=useState(false);
  const fields=mode==="register" ? [["first","First name","text"],["last","Last name","text"],["birth","Date of birth","date"]] : [["mrn","Patient identifier (MRN)","text"],["account","Approved account ID","text"]];
  return <details className="tile mb-4"><summary>{mode==="register"?"Register patient":"Assign a care professional or link a patient account"}</summary>
    <form className="grid gap-3 mt-4" onSubmit={async e=>{
      e.preventDefault();const form=e.currentTarget;setBusy(true);setStatus("");
      try { await (mode==="register"?registerPatient:assignPatientAccount)(new FormData(form));form.reset();setStatus("Saved.");onSaved?.(); }
      catch {setStatus("Could not save. Check the details and account permissions.");} finally {setBusy(false);}
    }}>
      {fields.map(([name,label,type])=><label key={name}>{label}<input className="block rounded border p-2 w-full" name={name} type={type} required maxLength={100}/></label>)}
      <label><input type="checkbox" required name={mode==="register"?"consent":"verified"}/> {mode==="register"?"I recorded the patient's consent for treatment summary access.":"I independently verified the account holder’s identity and their relationship to this patient."}</label>
      <button className="btn" disabled={busy}>{busy?"Saving…":"Save"}</button><p role="status">{status}</p>
    </form></details>;
}
