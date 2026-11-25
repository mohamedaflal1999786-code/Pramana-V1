/**
 * Pramana-V1 Clinical Document Ingestion & Extraction Server Actions
 * Team: Unknown GenZ
 *
 * Implements authenticated server actions:
 * - Upload & Validation
 * - Storage in Supabase Private Bucket (clinical-documents)
 * - Multi-Format Parsing & Extraction Engine Invocation
 * - Evidence Persistence & Grounding
 * - Signed URL Generation
 * - Human Professional Review (Verify / Reject / Clarify)
 * - Immutable Audit Logging
 */

"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/auth/audit";
import {
  validateClinicalDocument,
  uploadToClinicalStorage,
  generateSignedDocumentUrl,
  deleteFromClinicalStorage,
} from "@/lib/storage/document-storage";
import { executeDocumentExtraction } from "@/lib/extraction/engine";
import type { ReviewStatus, ClinicalEntityType } from "@/lib/extraction/types";
import type { DocumentType } from "@/types/database.types";

async function authorizedDocumentOrg() {
  const supabase = await createSupabaseServerClient();
  const admin = getSupabaseAdminClient();
  if (!supabase || !admin) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) return null;
  const { data: member, error } = await admin.from("organization_members").select("organization_id,role_id,is_active").eq("user_id",user.id).maybeSingle();
  if (error || !member?.is_active || !["doctor","pharmacist","institutional_admin","platform_admin"].includes(member.role_id)) return null;
  return member.organization_id;
}

export interface DocumentUploadResponse {
  success: boolean;
  documentId?: string;
  versionNumber?: number;
  sha256Hash?: string;
  title?: string;
  entityCount?: number;
  message?: string;
  error?: string;
}

export interface DocumentListItem {
  id: string;
  title: string;
  documentType: string;
  mimeType: string;
  fileSizeBytes: number;
  storagePath: string;
  currentVersionNumber: number;
  quarantineStatus: string;
  createdAt: string;
  entityCount: number;
  patientMrn?: string;
}

/**
 * 1. Upload & Ingest Clinical Document
 */
export async function uploadClinicalDocumentAction(
  formData: FormData
): Promise<DocumentUploadResponse> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Authentication service unavailable." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email_confirmed_at) {
    return { success: false, error: "Authentication required to upload clinical documents." };
  }

  const file = formData.get("file") as File | null;
  const documentType = ((formData.get("documentType") as string) || "discharge_summary") as DocumentType;
  const customTitle = (formData.get("title") as string)?.trim();
  const patientId = (formData.get("patientId") as string) || "00000000-0000-0000-0000-000000000002";

  if (!(file instanceof File) || file.size > 25 * 1024 * 1024) {
    return { success: false, error: "No file was attached to the ingestion request." };
  }

  const defaultOrgId = await authorizedDocumentOrg();
  if (!defaultOrgId) return { success: false, error: "Authorized clinical membership required." };
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Server-side validation
  const validation = validateClinicalDocument(
    buffer,
    file.name,
    file.type,
    defaultOrgId,
    patientId
  );

  if (!validation.isValid) {
    return {
      success: false,
      error: `Validation failed: ${validation.errors.join("; ")}`,
    };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return { success: false, error: "Admin database client unavailable." };
  }

  const { data: patient, error: patientError } = await admin.from("patients").select("id").eq("id",patientId).eq("organization_id",defaultOrgId).maybeSingle();
  if (patientError || !patient) return { success: false, error: "Patient not available in authorized organization." };

  // Duplicate detection by SHA-256 within the institution
  const { data: existingVersion } = await admin
    .from("document_versions")
    .select("document_id, version_number")
    .eq("sha256_hash", validation.sha256Hash)
    .eq("organization_id", defaultOrgId)
    .maybeSingle();

  if (existingVersion) {
    return {
      success: false,
      error: `Duplicate file detected. This document already exists under Document ID ${existingVersion.document_id} (Version ${existingVersion.version_number}).`,
    };
  }

  // Upload to private Supabase storage bucket
  const storageUpload = await uploadToClinicalStorage(
    buffer,
    validation.storagePath,
    validation.mimeType
  );

  if (!storageUpload.success) {
    return {
      success: false,
      error: `Storage upload failed: ${storageUpload.error}`,
    };
  }

  const documentTitle = customTitle || validation.sanitizedFilename;
  const docId = crypto.randomUUID();

  // Create clinical_documents record
  const { error: docError } = await admin.from("clinical_documents").insert({
    id: docId,
    organization_id: defaultOrgId,
    patient_id: patientId,
    title: documentTitle,
    document_type: documentType,
    mime_type: validation.mimeType,
    file_size_bytes: validation.fileSizeBytes,
    storage_path: validation.storagePath,
    current_version_number: 1,
    quarantine_status: "validated",
  });

  if (docError) {
    await deleteFromClinicalStorage(validation.storagePath);
    return { success: false, error: `Database insert failed: ${docError.message}` };
  }

  const versionId = crypto.randomUUID();

  // Create document_versions record
  const {error: versionError} = await admin.from("document_versions").insert({
    id: versionId,
    organization_id: defaultOrgId,
    document_id: docId,
    version_number: 1,
    sha256_hash: validation.sha256Hash,
    storage_path: validation.storagePath,
    uploaded_by: user.id,
  });

  if (versionError) return {success:false,documentId:docId,error:"Document version could not be recorded. Contact an administrator."};
  const jobId = crypto.randomUUID();

  // Create extraction_jobs record
  const {error: jobError} = await admin.from("extraction_jobs").insert({
    id: jobId,
    organization_id: defaultOrgId,
    document_version_id: versionId,
    status: "processing",
    model_version: "pramana-extractor-v1.2.0",
    started_at: new Date().toISOString(),
  });

  if (jobError) return {success:false,documentId:docId,error:"Extraction job could not be created."};
  // Run Extraction Engine
  const extraction = await executeDocumentExtraction(
    buffer,
    validation.sanitizedFilename,
    validation.mimeType,
    validation.sha256Hash,
    docId,
    1
  );

  // Persist Extracted Entities into clinical_entities
  if (extraction.entities.length > 0) {
    const entityRows = extraction.entities.map((e) => ({
      id: e.id,
      organization_id: defaultOrgId,
      document_version_id: versionId,
      patient_id: patientId,
      entity_type: e.entityType,
      raw_text: e.rawText,
      normalized_code: e.normalizedCode,
      normalized_name: e.normalizedName,
      source_location: e.sourceLocation as any,
      confidence_score: e.confidenceScore,
      is_verified: false,
    }));

    const {error: entityError} = await admin.from("clinical_entities").insert(entityRows);
    if (entityError) { await admin.from("extraction_jobs").update({status:"failed",error_message:"Entity persistence failed",completed_at:new Date().toISOString()}).eq("id",jobId); return {success:false,documentId:docId,error:"Extracted evidence could not be saved."}; }
  }

  // Update extraction_jobs to completed
  await admin
    .from("extraction_jobs")
    .update({
      status: extraction.success ? "completed" : "failed",
      completed_at: new Date().toISOString(),
      metadata: {
        totalPages: extraction.totalPages,
        entityCount: extraction.entities.length,
        method: extraction.extractionMethod,
        durationMs: extraction.processingDurationMs,
      },
      error_message: extraction.errors.length > 0 ? extraction.errors.join("; ") : null,
    })
    .eq("id", jobId);

  // Log Audit Event
  await logAuditEvent({
    action: "auth.login_success", // general audit
    userId: user.id,
    organizationId: defaultOrgId,
    entityType: "clinical_document",
    entityId: docId,
    details: {
      action_type: "document.ingested",
      title: documentTitle,
      sha256: validation.sha256Hash,
      mimeType: validation.mimeType,
      entityCount: extraction.entities.length,
    },
  });

  return {
    success: extraction.success,
    error: extraction.success ? undefined : "Extraction failed. Document retained for investigation.",
    documentId: docId,
    versionNumber: 1,
    sha256Hash: validation.sha256Hash,
    title: documentTitle,
    entityCount: extraction.entities.length,
    message: extraction.success ? `Document ingested successfully (${extraction.entities.length} clinical tokens grounded).` : "Extraction failed.",
  };
}

/**
 * 2. List Clinical Documents for Active Institution
 */
export async function listClinicalDocumentsAction(
  searchQuery?: string
): Promise<DocumentListItem[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];

  const defaultOrgId = await authorizedDocumentOrg();
  if (!defaultOrgId) return [];

  let query = admin
    .from("clinical_documents")
    .select(`
      id,
      title,
      document_type,
      mime_type,
      file_size_bytes,
      storage_path,
      current_version_number,
      quarantine_status,
      created_at,
      patients ( mrn )
    `)
    .eq("organization_id", defaultOrgId)
    .order("created_at", { ascending: false }).limit(100);

  if (searchQuery && searchQuery.length <= 120) {
    query = query.ilike("title", `%${searchQuery}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    documentType: doc.document_type,
    mimeType: doc.mime_type,
    fileSizeBytes: doc.file_size_bytes,
    storagePath: doc.storage_path,
    currentVersionNumber: doc.current_version_number,
    quarantineStatus: doc.quarantine_status,
    createdAt: doc.created_at,
    entityCount: 0,
    patientMrn: doc.patients?.mrn || undefined,
  }));
}

/**
 * 3. Get Document Details & Extracted Entities
 */
export async function getDocumentDetailsAction(documentId: string) {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const org = await authorizedDocumentOrg();
  if (!org) return null;
  const { data: doc, error: docError } = await admin
    .from("clinical_documents")
    .select("*, patients(mrn, first_name, last_name)")
    .eq("id", documentId)
    .eq("organization_id", org)
    .single();

  if (docError || !doc) return null;

  // Fetch document versions
  const { data: versions } = await admin
    .from("document_versions")
    .select("*")
    .eq("document_id", documentId).eq("organization_id",org)
    .order("version_number", { ascending: false });

  // Fetch extracted clinical entities
  const versionId = versions?.[0]?.id;
  let entities: any[] = [];
  if (versionId) {
    const { data: entityData } = await admin
      .from("clinical_entities")
      .select("*")
      .eq("document_version_id", versionId).eq("organization_id",org)
      .order("created_at", { ascending: true });
    entities = entityData || [];
  }

  // Generate signed URL
  const signedUrl = await generateSignedDocumentUrl(doc.storage_path, 900);

  return {
    document: doc,
    versions: versions || [],
    entities,
    signedUrl,
  };
}

/**
 * 4. Human Professional Review of Extracted Evidence
 */
export async function reviewEntityAction(
  entityId: string,
  reviewAction: "verify" | "reject" | "clarify",
  rationale?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: "Auth unavailable." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email_confirmed_at) return { success: false, error: "Authentication required." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { success: false, error: "Admin client unavailable." };

  const org = await authorizedDocumentOrg();
  if (!org) return { success: false, error: "Authorized membership required." };
  const isVerified = reviewAction === "verify";

  const { error } = await admin
    .from("clinical_entities")
    .update({
      is_verified: isVerified,
    })
    .eq("id", entityId).eq("organization_id", org);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditEvent({
    action: "auth.login_success",
    userId: user.id,
    entityType: "clinical_entity",
    entityId,
    details: {
      action_type: "evidence.reviewed",
      review_action: reviewAction,
      rationale: rationale || "Attending physician clinical verification",
      is_verified: isVerified,
    },
  });

  return { success: true };
}

/**
 * 5. Delete Clinical Document
 */
export async function deleteClinicalDocumentAction(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = getSupabaseAdminClient();
  if (!admin) return { success: false, error: "Admin client unavailable." };

  const org = await authorizedDocumentOrg();
  if (!org) return { success: false, error: "Authorized membership required." };
  const { data: doc } = await admin
    .from("clinical_documents")
    .select("storage_path")
    .eq("id", documentId).eq("organization_id", org)
    .single();
  if (!doc) return {success:false,error:"Document not found."};
  const supabase = await createSupabaseServerClient();
  const user = (await supabase?.auth.getUser())?.data.user;
  if (!user?.email_confirmed_at) return {success:false,error:"Authentication required."};
  const {data:member}=await admin.from("organization_members").select("role_id,is_active").eq("user_id",user.id).eq("organization_id",org).maybeSingle();
  if (!member?.is_active || !["institutional_admin","platform_admin"].includes(member.role_id)) return {success:false,error:"Administrator required."};

  if (doc?.storage_path) {
    await deleteFromClinicalStorage(doc.storage_path);
  }

  const { error } = await admin.from("clinical_documents").delete().eq("id", documentId).eq("organization_id", org);
  if (error) return { success: false, error: error.message };

  return { success: true };
}
