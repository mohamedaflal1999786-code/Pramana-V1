"use client";

import * as React from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { runClinicalDocumentAiAnalysisAction } from "@/lib/actions/ai-actions";
import { listEncounterSources } from "@/lib/actions/care-actions";
import { PatientPicker } from "@/components/workspace/PatientPicker";
import { FileUpload } from "@/components/ui/FileUpload";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import {
  FileText,
  UploadCloud,
  Search,
  Eye,
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Check,
  X as XIcon,
  HelpCircle,
  RefreshCw,
  FileCode,
  Layers,
} from "lucide-react";
import {
  uploadClinicalDocumentAction,
  listClinicalDocumentsAction,
  getDocumentDetailsAction,
  reviewEntityAction,
  type DocumentListItem,
} from "@/lib/actions/document-actions";

export default function DocumentIntelligencePage() {
  const [patientId,setPatientId] = React.useState("");
  const [previous,setPrevious]=React.useState("");
  const [encounters,setEncounters] = React.useState<{id:string;encounter_number:string}[]>([]);
  const [encounterId,setEncounterId] = React.useState("");
  React.useEffect(()=>{
    let current=true; setEncounterId("");setEncounters([]);setPrevious("");
    if(patientId) listEncounterSources(patientId).then(r=>{if(current)setEncounters(r.encounters);}).catch(()=>{if(current)setUploadStatus({success:false,message:"Encounter list unavailable."});});
    return ()=>{current=false;};
  },[patientId]);
  const [activeTab, setActiveTab] = React.useState<"upload" | "extracted">("upload");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("discharge_summary");
  const [customTitle, setCustomTitle] = React.useState<string>("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<{ success?: boolean; message?: string } | null>(null);

  // Document Library
  const [documents, setDocuments] = React.useState<DocumentListItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Detailed selected document & extracted entities
  const [selectedDocId, setSelectedDocId] = React.useState<string | null>(null);
  const [docDetails, setDocDetails] = React.useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);

  const fetchDocuments = React.useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const data = await listClinicalDocumentsAction(searchQuery);
      setDocuments(data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  }, [searchQuery]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Load details when a document is selected
  const handleSelectDocument = async (id: string) => {
    setSelectedDocId(id);
    setIsLoadingDetails(true);
    try {
      const details = await getDocumentDetailsAction(id);
      setDocDetails(details);
    } catch (err) {
      console.error("Failed to load details:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Upload handler
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("patientId",patientId);
      if(previous) formData.set("previousDocument",previous);
      if(encounterId) formData.set("encounterId",encounterId);
      formData.set("documentType", selectedCategory);
      if (customTitle.trim()) {
        formData.set("title", customTitle.trim());
      }

      const result = await uploadClinicalDocumentAction(formData);

      if (result.success) {
        setUploadStatus({
          success: true,
          message: `${result.title || file.name} uploaded and grounded successfully (${result.entityCount || 0} clinical tokens identified).`,
        });
        setCustomTitle("");
        await fetchDocuments();
        if (result.documentId) {
          await handleSelectDocument(result.documentId);
          setActiveTab("extracted");
        }
      } else {
        setUploadStatus({
          success: false,
          message: result.error || "Failed to ingest document.",
        });
      }
    } catch (err: any) {
      setUploadStatus({
        success: false,
        message: err?.message || "An unexpected error occurred during document upload.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Review entity action
  const handleReviewEntity = async (entityId: string, action: "verify" | "reject" | "clarify") => {
    const rationale = window.prompt("Reason for this evidence decision");
    if (!rationale?.trim()) return;
    const res = await reviewEntityAction(entityId, action, rationale);
    if (!res.success) setUploadStatus({success:false,message:res.error});
    if (res.success && selectedDocId) {
      await handleSelectDocument(selectedDocId);
    }
  };

  return (
    <WorkspaceLayout pageTitle="Document Intelligence">
      <PageHeader
        eyebrow="Clinical Document Intelligence"
        title="Multi-Source Ingestion & Extraction"
        description="Ingest unstructured clinical notes, lab reports, transfer summaries, and prescriptions while preserving immutable source provenance."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDocuments}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? "animate-spin" : ""}`} />}
          >
            Refresh Library
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-[var(--line)] gap-6">
        <button
          onClick={() => setActiveTab("upload")}
          className={`pb-3 text-[14px] font-[650] border-b-2 transition-colors cursor-pointer ${
            activeTab === "upload"
              ? "border-[var(--green)] text-[var(--green)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          1. Ingest Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab("extracted")}
          className={`pb-3 text-[14px] font-[650] border-b-2 transition-colors cursor-pointer ${
            activeTab === "extracted"
              ? "border-[var(--green)] text-[var(--green)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          2. Extracted Entities & Tokens {docDetails?.entities?.length ? `(${docDetails.entities.length})` : ""}
        </button>
      </div>

      {uploadStatus && (
        <div
          className={`p-3 text-[13px] rounded-[7px] border flex items-center gap-2 ${
            uploadStatus.success
              ? "text-[#145a45] bg-[#e5f1df] border-[#c3d8c8]"
              : "text-[#b91c1c] bg-[#fdf2f2] border-[#f5c6c6]"
          }`}
        >
          {uploadStatus.success ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{uploadStatus.message}</span>
        </div>
      )}

      {activeTab === "upload" ? (
        <div className="space-y-6">
          {/* Document Ingestion Zone */}
          <div className="bg-white p-6 rounded-[12px] border border-[var(--line)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0 mb-1">
                  Ingest Encounter Documentation
                </h3>
                <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
                  Supports PDF, TXT, JPG, PNG, JSON, FHIR R4, XML, and HL7 v2 (Max 3.5 MB). Files are validated, hashed (SHA-256), and encrypted in private tenancy storage.
                </p>
              </div>
            </div>

            {/* Ingestion Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[12px] font-[650] text-[var(--ink)] mb-1">
                  Clinical Document Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-[13px] border border-[var(--line)] rounded-[7px] py-2 px-3 bg-[#faf9f5] focus:border-[var(--green)] focus:outline-none"
                >
                  <option value="discharge_summary">Discharge Summary</option>
                  <option value="progress_note">Progress Note</option>
                  <option value="nursing_handoff">Nursing Handoff</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="pharmacy_order">Pharmacy Order / Prescription</option>
                  <option value="transfer_record">Transfer Record</option>
                  <option value="consultation">Consultation Note</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-[650] text-[var(--ink)] mb-1">
                  Custom Document Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ICU Discharge Note - Ward 4"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full text-[13px] border border-[var(--line)] rounded-[7px] py-2 px-3 bg-[#faf9f5] focus:border-[var(--green)] focus:outline-none"
                />
              </div>
            </div>

            <PatientPicker value={patientId} onChange={setPatientId} />
            <label>Document version<select className="block mb-4 border p-2" value={previous} onChange={e=>setPrevious(e.target.value)}><option value="">New document</option>{documents.filter(d=>d.patientId===patientId).map(d=><option key={d.id} value={d.id}>New version of {d.title}</option>)}</select></label>
            <label>Encounter<select className="block mb-4 border p-2" value={encounterId} onChange={e=>setEncounterId(e.target.value)}>
              <option value="">No encounter selected</option>{encounters.map(e=><option key={e.id} value={e.id}>{e.encounter_number}</option>)}
            </select></label>
            <FileUpload
              onFilesSelected={handleFilesSelected}
              acceptedFormats={[".pdf", ".txt", ".jpg", ".jpeg", ".png", ".json", ".xml", ".hl7"]}
              maxSizeMB={3.5}
              disabled={isUploading}
            />

            {isUploading && (
              <div className="p-3 bg-[#faf9f5] border border-[var(--line)] rounded-[7px] flex items-center justify-center gap-2 text-[13px] text-[var(--green)]">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Hashing file, uploading to private storage, and extracting tokens...</span>
              </div>
            )}
          </div>

          {/* Document Inventory / Library */}
          <div className="bg-white p-6 rounded-[12px] border border-[var(--line)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--line)] mb-4 gap-4">
              <div>
                <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">
                  Institutional Document Inventory
                </h3>
                <p className="text-[12px] text-[var(--muted)] my-0">
                  Cryptographically verified clinical files stored in private Supabase bucket.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-[12px] border border-[var(--line)] rounded-[6px] py-1.5 px-3 bg-[#faf9f5]"
                />
                <Badge variant={documents.length > 0 ? "verified" : "unverified"}>
                  {documents.length} Files Ingested
                </Badge>
              </div>
            </div>

            {documents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="font-semibold text-[var(--ink)]">{doc.title}</div>
                        <div className="text-[11px] font-mono text-[var(--muted)] truncate max-w-[200px]">
                          {doc.storagePath}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-[12px] text-[var(--ink)]">
                          {doc.documentType.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] font-mono uppercase bg-[#faf9f5] px-1.5 py-0.5 rounded border border-[var(--line)]">
                          {doc.mimeType.split("/")[1] || "doc"}
                        </span>
                      </TableCell>
                      <TableCell className="text-[12px] text-[var(--muted)]">
                        {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                      </TableCell>
                      <TableCell>
                        <Badge variant="verified">Validated</Badge>
                      </TableCell>
                      <TableCell className="text-[12px] text-[var(--muted)]">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleSelectDocument(doc.id);
                            setActiveTab("extracted");
                          }}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={<FileText className="w-8 h-8" />}
                title="No Documents in Institutional Library"
                description="Upload patient discharge records, nursing notes, or lab results above to initiate ingestion."
              />
            )}
          </div>
        </div>
      ) : (
        /* Extracted Entities & Source Grounding View */
        <div className="space-y-6">
          {docDetails ? (
            <div className="space-y-6">
              {/* Document Metadata Bar */}
              <div className="p-4 rounded-[10px] bg-white border border-[var(--line)] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold tracking-[1.2px] text-[var(--green)] uppercase block">
                    ACTIVE EVIDENCE SOURCE
                  </span>
                  <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0">
                    {docDetails.document.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[12px] text-[var(--muted)] mt-1">
                    <span>Category: <strong className="text-[var(--ink)] capitalize">{docDetails.document.document_type.replace("_", " ")}</strong></span>
                    <span>•</span>
                    <span>Format: <strong className="font-mono text-[var(--ink)]">{docDetails.document.mime_type}</strong></span>
                    <span>•</span>
                    <span><button className="underline mr-3" onClick={async()=>{try { await runClinicalDocumentAiAnalysisAction(docDetails.document.id); await handleSelectDocument(docDetails.document.id); setUploadStatus({success:true,message:"Analysis saved."}); } catch {setUploadStatus({success:false,message:"Analysis could not be completed."});}}}>Analyze source</button>Patient MRN: <strong className="font-mono text-[var(--ink)]">{docDetails.document.patients?.mrn || "Unavailable"}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {docDetails.signedUrl && (
                    <a
                      href={docDetails.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-[650] bg-[#145a45] text-white hover:bg-[#0f4636] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Original Source
                    </a>
                  )}
                </div>
              </div>

              {/* Extracted Tokens Table & Review Panel */}
              <div className="bg-white rounded-[12px] border border-[var(--line)] p-6">
                <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] mb-4">
                  <div>
                    <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">
                      Grounded Clinical Tokens ({docDetails.entities.length})
                    </h3>
                    <p className="text-[12px] text-[var(--muted)] my-0">
                      Extracted entities linked to exact page numbers, character offsets, or token coordinates.
                    </p>
                  </div>
                  <Badge variant="verified">Engine: pramana-extractor-v1.2.0</Badge>
                </div>

                {docDetails.entities.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entity Type</TableHead>
                        <TableHead>Extracted Clinical Text</TableHead>
                        <TableHead>Source Coordinates</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Verification</TableHead>
                        <TableHead className="text-right">Human Review</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docDetails.entities.map((ent: any) => (
                        <TableRow key={ent.id}>
                          <TableCell>
                            <span className="capitalize text-[12px] font-semibold text-[var(--ink)]">
                              {ent.entity_type.replace("_", " ")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-[var(--ink)] text-[13px]">{ent.raw_text}</div>
                            {ent.normalized_code && (
                              <div className="text-[11px] font-mono text-[var(--muted)]">{ent.normalized_code}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-[12px] font-mono text-[var(--ink)]">
                              Page {ent.source_location?.pageNumber || 1}
                              {ent.source_location?.charStart !== undefined && (
                                <span className="text-[var(--muted)]"> [chars {ent.source_location.charStart}-{ent.source_location.charEnd}]</span>
                              )}
                              {ent.source_location?.jsonPath && (
                                <span className="text-[var(--muted)]"> ({ent.source_location.jsonPath})</span>
                              )}
                              {ent.source_location?.hl7Segment && (
                                <span className="text-[var(--muted)]"> ({ent.source_location.hl7Segment})</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-[12px] font-semibold text-[var(--green)]">
                              {ent.confidence_score == null ? "Unavailable" : Math.round(ent.confidence_score * 100) + "%"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {ent.is_verified ? (
                              <Badge variant="verified">Verified</Badge>
                            ) : (
                              <Badge variant="pending">Awaiting Review</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-1.5">
                            {!ent.is_verified ? (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleReviewEntity(ent.id, "verify")}
                                leftIcon={<Check className="w-3.5 h-3.5" />}
                              >
                                Verify
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReviewEntity(ent.id, "reject")}
                                leftIcon={<XIcon className="w-3.5 h-3.5" />}
                              >
                                Reject
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    icon={<Search className="w-8 h-8" />}
                    title="No Entities Extracted"
                    description="The extraction pipeline did not locate recognized clinical terms in this document."
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[12px] border border-[var(--line)] text-center">
              <EmptyState
                icon={<Layers className="w-8 h-8" />}
                title="Select a Document to Inspect Evidence"
                description="Select an ingested document from the 'Ingest Documents' tab to inspect source page numbers, bounding coordinates, and review extracted clinical terms."
              />
            </div>
          )}
        </div>
      )}
    </WorkspaceLayout>
  );
}
