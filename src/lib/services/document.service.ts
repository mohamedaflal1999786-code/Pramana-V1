/**
 * Pramana-V1 Clinical Document Service
 * Team: Unknown GenZ
 *
 * Handles clinical document metadata registration, versioning, SHA-256 hashing,
 * and quarantine lifecycle tracking.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import { validateClinicalDocument, MAX_FILE_SIZE_BYTES } from "@/lib/storage/document-storage";
import type { Database, DocumentType, AllowedMimeType } from "@/types/database.types";

export interface RegisterDocumentInput {
  organizationId: string;
  patientId: string;
  encounterId?: string | null;
  title: string;
  documentType: DocumentType;
  fileBuffer: Buffer;
  filename: string;
  declaredMimeType: string;
  uploadedBy?: string | null;
}

export interface RegisterDocumentResult {
  success: boolean;
  documentId?: string;
  versionId?: string;
  sha256Hash?: string;
  storagePath?: string;
  fileSizeBytes: number;
  quarantineStatus: "pending_scan" | "validated" | "quarantined" | "rejected";
  errors?: string[];
}

export async function registerClinicalDocument(
  input: RegisterDocumentInput
): Promise<RegisterDocumentResult> {
  // 1. Run server-side document validation
  const validation = validateClinicalDocument(
    input.fileBuffer,
    input.filename,
    input.declaredMimeType,
    input.organizationId
  );

  if (!validation.isValid) {
    return {
      success: false,
      fileSizeBytes: input.fileBuffer.length,
      quarantineStatus: "rejected",
      errors: validation.errors,
    };
  }

  const status = getSupabaseConfigStatus();

  // 2. If Supabase is active, persist to database
  if (status.isConfigured && status.hasServiceRoleKey) {
    try {
      const admin = getSupabaseAdminClient();
      if (admin) {
        // Create document record
        const { data: doc, error: docErr } = await admin
          .from("clinical_documents")
          .insert({
            organization_id: input.organizationId,
            patient_id: input.patientId,
            encounter_id: input.encounterId || null,
            title: input.title.trim(),
            document_type: input.documentType,
            mime_type: validation.mimeType,
            file_size_bytes: validation.fileSizeBytes,
            storage_path: validation.storagePath,
            current_version_number: 1,
            quarantine_status: "validated",
          })
          .select("id")
          .single();

        if (docErr) {
          return {
            success: false,
            fileSizeBytes: validation.fileSizeBytes,
            quarantineStatus: "rejected",
            errors: [docErr.message],
          };
        }

        // Create initial document version record
        const { data: ver, error: verErr } = await admin
          .from("document_versions")
          .insert({
            organization_id: input.organizationId,
            document_id: doc.id,
            version_number: 1,
            sha256_hash: validation.sha256Hash,
            storage_path: validation.storagePath,
            uploaded_by: input.uploadedBy || null,
            change_summary: "Initial ingestion upload",
          })
          .select("id")
          .single();

        if (verErr) {
          return {
            success: false,
            documentId: doc.id,
            fileSizeBytes: validation.fileSizeBytes,
            quarantineStatus: "rejected",
            errors: [verErr.message],
          };
        }

        return {
          success: true,
          documentId: doc.id,
          versionId: ver.id,
          sha256Hash: validation.sha256Hash,
          storagePath: validation.storagePath,
          fileSizeBytes: validation.fileSizeBytes,
          quarantineStatus: "validated",
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Database write error";
      return {
        success: false,
        fileSizeBytes: validation.fileSizeBytes,
        quarantineStatus: "rejected",
        errors: [msg],
      };
    }
  }

  // Local development / Unconfigured fallback
  return {
    success: true,
    sha256Hash: validation.sha256Hash,
    storagePath: validation.storagePath,
    fileSizeBytes: validation.fileSizeBytes,
    quarantineStatus: "validated",
    errors: ["Supabase unconfigured; simulated validation completed."],
  };
}
