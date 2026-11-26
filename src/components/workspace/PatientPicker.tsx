"use client";
import { useEffect, useRef, useState } from "react";
import { listAssignedPatients } from "@/lib/actions/care-actions";

export function PatientPicker({value,onChange}:{value:string;onChange:(id:string)=>void}) {
  const [patients,setPatients] = useState<{id:string;mrn:string}[]>([]);
  const [message,setMessage] = useState("Loading assigned patients…");
  const selectionHandler=useRef(onChange);
  useEffect(()=>{selectionHandler.current=onChange;},[onChange]);
  useEffect(() => {
    let mounted = true;
    const requested = new URLSearchParams(window.location.search).get("patient");
    listAssignedPatients().then(rows => {
      if (mounted) { if (requested && rows.some(r=>r.id===requested)) selectionHandler.current(requested); setPatients(rows); setMessage(rows.length ? "Select a patient" : "No patients assigned"); }
    }).catch(() => { if (mounted) setMessage("Patient directory unavailable"); });
    return () => { mounted = false; };
  },[]);
  return <label className="block mb-4">Patient record
    <select className="block border rounded p-2 max-w-full" value={value} onChange={e=>onChange(e.target.value)}>
      <option value="">{message}</option>
      {patients.map(row=><option key={row.id} value={row.id}>{row.mrn}</option>)}
    </select>
  </label>;
}
