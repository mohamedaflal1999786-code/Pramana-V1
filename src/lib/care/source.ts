import "server-only";
import { createHash } from "node:crypto";
import { requireClinicalMember,requirePatient } from "./access";
import { parsePdfDocument } from "@/lib/extraction/parsers/pdf-parser";

export async function readClinicalSource(id:string) {
  const {admin,member} = await requireClinicalMember();
  const {data:doc} = await admin.from("clinical_documents")
    .select("id, title, mime_type, encounter_id, patient_id, organization_id, current_version_number, quarantine_status")
    .eq("id",id).eq("organization_id",member.organization_id).maybeSingle();
  if (!doc || doc.quarantine_status!=="validated") throw new Error("Validated document required.");
  const scope = await requirePatient(doc.patient_id);
  const {data:version} = await admin.from("document_versions").select("id,version_number,storage_path,sha256_hash")
    .eq("organization_id",scope.org).eq("document_id",id).eq("version_number",doc.current_version_number).single();
  if (!version?.storage_path.startsWith(scope.org+"/"+scope.patientId+"/")) throw new Error("Document version unavailable.");
  const {data:blob,error} = await admin.storage.from("clinical-documents").download(version.storage_path);
  if (error || !blob) throw new Error("Source file unavailable.");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex")!==version.sha256_hash) throw new Error("Source integrity check failed.");
  if (!["application/pdf","text/plain"].includes(doc.mime_type)) throw new Error("Analysis requires a PDF or plain text source.");
  const text = doc.mime_type==="application/pdf" ? (await parsePdfDocument(bytes)).fullText : new TextDecoder().decode(bytes);
  if (!text.trim()) throw new Error("Source contains no readable text.");
  return {scope,doc,version,text};
}
