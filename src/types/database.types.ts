/**
 * Pramana-V1 - Comprehensive PostgreSQL Database Type Definitions
 * Team: Unknown GenZ
 *
 * Generated and synchronized with Supabase migrations:
 * 001_institutional_management
 * 002_patient_and_encounters
 * 003_clinical_intelligence
 * 004_safety_provenance_graph
 * 005_professional_verification
 * 006_platform_governance
 * 007_storage_buckets
 * 008_row_level_security
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | "platform_admin"
  | "institutional_admin"
  | "doctor"
  | "pharmacist"
  | "safety_officer"
  | "patient";

export type VerificationStatus =
  | "pending_review"
  | "endorsed"
  | "rejected"
  | "clarification_requested"
  | "superseded";

export type AlertSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "informational";

export type DocumentType =
  | "discharge_summary"
  | "progress_note"
  | "nursing_handoff"
  | "lab_report"
  | "pharmacy_order"
  | "transfer_record"
  | "consultation";

export type AllowedMimeType =
  | "application/pdf"
  | "text/plain"
  | "application/json"
  | "application/xml"
  | "text/xml"
  | "application/hl7-v2+er7"
  | "image/jpeg"
  | "image/png";

export type ExtractionStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "partially_extracted";

export type StorageScanStatus =
  | "pending_scan"
  | "validated"
  | "quarantined"
  | "rejected";

export type ProvenanceNodeType =
  | "clinical_document"
  | "document_version"
  | "source_chunk"
  | "extracted_entity"
  | "versioned_rule"
  | "safety_alert"
  | "clinical_review"
  | "professional_attestation";

export type ProvenanceEdgeType =
  | "contains_version"
  | "extracted_from"
  | "triggers_rule"
  | "generates_alert"
  | "reviewed_by"
  | "attested_by"
  | "superseded_by"
  | "contradicts";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          domain: string | null;
          tier: "standard" | "academic" | "enterprise" | "pilot";
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          domain?: string | null;
          tier?: "standard" | "academic" | "enterprise" | "pilot";
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          domain?: string | null;
          tier?: "standard" | "academic" | "enterprise" | "pilot";
          is_active?: boolean;
          metadata?: Json;
          updated_at?: string;
        };
      };

      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };

      roles: {
        Row: {
          id: string;
          name: string;
          description: string;
          is_clinical: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          is_clinical?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          is_clinical?: boolean;
        };
      };

      permissions: {
        Row: {
          id: string;
          category: string;
          description: string;
        };
        Insert: {
          id: string;
          category: string;
          description: string;
        };
        Update: {
          category?: string;
          description?: string;
        };
      };

      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
        };
        Update: never;
      };

      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role_id: string;
          department: string | null;
          license_number: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role_id: string;
          department?: string | null;
          license_number?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role_id?: string;
          department?: string | null;
          license_number?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };

      invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role_id: string;
          token: string;
          invited_by: string | null;
          status: "pending" | "accepted" | "expired" | "revoked";
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role_id: string;
          token: string;
          invited_by?: string | null;
          status?: "pending" | "accepted" | "expired" | "revoked";
          expires_at: string;
          created_at?: string;
        };
        Update: {
          status?: "pending" | "accepted" | "expired" | "revoked";
        };
      };

      account_approval_requests: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          requested_role_id: string;
          status: "pending" | "approved" | "rejected";
          reviewed_by: string | null;
          rejection_reason: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          requested_role_id: string;
          status?: "pending" | "approved" | "rejected";
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          status?: "pending" | "approved" | "rejected";
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
        };
      };

      patients: {
        Row: {
          id: string;
          organization_id: string;
          mrn: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: "male" | "female" | "other" | "unknown" | null;
          is_synthetic: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          mrn: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender?: "male" | "female" | "other" | "unknown" | null;
          is_synthetic?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          date_of_birth?: string;
          gender?: "male" | "female" | "other" | "unknown" | null;
          updated_at?: string;
        };
      };

      patient_access: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          user_id: string;
          access_level: "read" | "proxy_caregiver";
          authorized_by: string | null;
          is_active: boolean;
          granted_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          user_id: string;
          access_level?: "read" | "proxy_caregiver";
          authorized_by?: string | null;
          is_active?: boolean;
          granted_at?: string;
          expires_at?: string | null;
        };
        Update: {
          access_level?: "read" | "proxy_caregiver";
          is_active?: boolean;
          expires_at?: string | null;
        };
      };

      encounters: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_number: string;
          encounter_type: "inpatient" | "outpatient" | "emergency" | "icu" | "telehealth";
          attending_physician_id: string | null;
          admission_date: string;
          discharge_date: string | null;
          status: "active" | "discharged" | "transferred" | "cancelled";
          summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_number: string;
          encounter_type: "inpatient" | "outpatient" | "emergency" | "icu" | "telehealth";
          attending_physician_id?: string | null;
          admission_date: string;
          discharge_date?: string | null;
          status?: "active" | "discharged" | "transferred" | "cancelled";
          summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          encounter_type?: "inpatient" | "outpatient" | "emergency" | "icu" | "telehealth";
          attending_physician_id?: string | null;
          discharge_date?: string | null;
          status?: "active" | "discharged" | "transferred" | "cancelled";
          summary?: string | null;
          updated_at?: string;
        };
      };

      clinical_documents: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          title: string;
          document_type: DocumentType;
          mime_type: AllowedMimeType;
          file_size_bytes: number;
          storage_path: string;
          current_version_number: number;
          quarantine_status: StorageScanStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          title: string;
          document_type: DocumentType;
          mime_type: AllowedMimeType;
          file_size_bytes: number;
          storage_path: string;
          current_version_number?: number;
          quarantine_status?: StorageScanStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          document_type?: DocumentType;
          current_version_number?: number;
          quarantine_status?: StorageScanStatus;
          updated_at?: string;
        };
      };

      document_versions: {
        Row: {
          id: string;
          organization_id: string;
          document_id: string;
          version_number: number;
          sha256_hash: string;
          storage_path: string;
          uploaded_by: string | null;
          change_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          document_id: string;
          version_number: number;
          sha256_hash: string;
          storage_path: string;
          uploaded_by?: string | null;
          change_summary?: string | null;
          created_at?: string;
        };
        Update: never;
      };

      extraction_jobs: {
        Row: {
          id: string;
          organization_id: string;
          document_version_id: string;
          status: ExtractionStatus;
          model_version: string | null;
          started_at: string | null;
          completed_at: string | null;
          error_message: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          document_version_id: string;
          status?: ExtractionStatus;
          model_version?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          status?: ExtractionStatus;
          model_version?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          metadata?: Json;
        };
      };

      clinical_entities: {
        Row: {
          id: string;
          organization_id: string;
          document_version_id: string;
          patient_id: string;
          entity_type: string;
          raw_text: string;
          normalized_code: string | null;
          normalized_name: string | null;
          source_location: Json;
          confidence_score: number | null;
          is_verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          document_version_id: string;
          patient_id: string;
          entity_type: string;
          raw_text: string;
          normalized_code?: string | null;
          normalized_name?: string | null;
          source_location?: Json;
          confidence_score?: number | null;
          is_verified?: boolean;
          created_at?: string;
        };
        Update: {
          is_verified?: boolean;
          normalized_code?: string | null;
          normalized_name?: string | null;
        };
      };

      medications: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          entity_id: string | null;
          drug_name: string;
          dose: string | null;
          frequency: string | null;
          route: string | null;
          status: "active" | "discontinued" | "hold" | "historical";
          start_date: string | null;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          entity_id?: string | null;
          drug_name: string;
          dose?: string | null;
          frequency?: string | null;
          route?: string | null;
          status?: "active" | "discontinued" | "hold" | "historical";
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          status?: "active" | "discontinued" | "hold" | "historical";
          dose?: string | null;
          frequency?: string | null;
          end_date?: string | null;
        };
      };

      allergies: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          allergen: string;
          reaction: string | null;
          severity: "mild" | "moderate" | "severe" | "life_threatening" | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          allergen: string;
          reaction?: string | null;
          severity?: "mild" | "moderate" | "severe" | "life_threatening" | null;
          created_at?: string;
        };
        Update: {
          reaction?: string | null;
          severity?: "mild" | "moderate" | "severe" | "life_threatening" | null;
        };
      };

      lab_results: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          test_name: string;
          value: string;
          unit: string | null;
          reference_range: string | null;
          flag: "normal" | "abnormal" | "critical_high" | "critical_low" | null;
          result_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          test_name: string;
          value: string;
          unit?: string | null;
          reference_range?: string | null;
          flag?: "normal" | "abnormal" | "critical_high" | "critical_low" | null;
          result_time: string;
          created_at?: string;
        };
        Update: {
          flag?: "normal" | "abnormal" | "critical_high" | "critical_low" | null;
        };
      };

      safety_rules: {
        Row: {
          id: string;
          rule_code: string;
          name: string;
          category: string;
          severity: AlertSeverity;
          description: string;
          clinical_rationale: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rule_code: string;
          name: string;
          category: string;
          severity: AlertSeverity;
          description: string;
          clinical_rationale: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          severity?: AlertSeverity;
          description?: string;
          clinical_rationale?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };

      safety_rule_versions: {
        Row: {
          id: string;
          rule_id: string;
          version_number: number;
          logic_definition: Json;
          author_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          rule_id: string;
          version_number: number;
          logic_definition: Json;
          author_id?: string | null;
          created_at?: string;
        };
        Update: never;
      };

      safety_alerts: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          rule_version_id: string;
          severity: AlertSeverity;
          title: string;
          summary: string;
          clinical_context: string | null;
          status: VerificationStatus;
          confidence_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          rule_version_id: string;
          severity: AlertSeverity;
          title: string;
          summary: string;
          clinical_context?: string | null;
          status?: VerificationStatus;
          confidence_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: VerificationStatus;
          clinical_context?: string | null;
          updated_at?: string;
        };
      };

      evidence_nodes: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          node_type: ProvenanceNodeType;
          reference_id: string;
          label: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          node_type: ProvenanceNodeType;
          reference_id: string;
          label: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          label?: string;
          metadata?: Json;
        };
      };

      evidence_edges: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          source_node_id: string;
          target_node_id: string;
          relationship_type: ProvenanceEdgeType;
          weight: number;
          provenance_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          source_node_id: string;
          target_node_id: string;
          relationship_type: ProvenanceEdgeType;
          weight?: number;
          provenance_notes?: string | null;
          created_at?: string;
        };
        Update: {
          weight?: number;
          provenance_notes?: string | null;
        };
      };

      clinical_reviews: {
        Row: {
          id: string;
          organization_id: string;
          alert_id: string;
          reviewer_id: string;
          reviewer_role: string;
          review_decision: "endorsed" | "rejected" | "clarification_requested" | "superseded";
          clinical_rationale: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          alert_id: string;
          reviewer_id: string;
          reviewer_role: string;
          review_decision: "endorsed" | "rejected" | "clarification_requested" | "superseded";
          clinical_rationale: string;
          created_at?: string;
        };
        Update: never;
      };

      handoff_reviews: {
        Row: {
          id: string;
          organization_id: string;
          encounter_id: string;
          outgoing_clinician_id: string;
          incoming_clinician_id: string;
          critical_actions_reviewed: boolean;
          pending_lab_orders_reviewed: boolean;
          code_status_verified: boolean;
          handoff_status: "pending" | "completed" | "discrepancy_flagged";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          encounter_id: string;
          outgoing_clinician_id: string;
          incoming_clinician_id: string;
          critical_actions_reviewed?: boolean;
          pending_lab_orders_reviewed?: boolean;
          code_status_verified?: boolean;
          handoff_status?: "pending" | "completed" | "discrepancy_flagged";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          critical_actions_reviewed?: boolean;
          pending_lab_orders_reviewed?: boolean;
          code_status_verified?: boolean;
          handoff_status?: "pending" | "completed" | "discrepancy_flagged";
          notes?: string | null;
        };
      };

      discharge_instructions: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          primary_language: string;
          dietary_guidelines: string | null;
          activity_restrictions: string | null;
          follow_up_appointments: Json;
          warning_symptoms: Json;
          is_verified: boolean;
          verified_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          primary_language?: string;
          dietary_guidelines?: string | null;
          activity_restrictions?: string | null;
          follow_up_appointments?: Json;
          warning_symptoms?: Json;
          is_verified?: boolean;
          verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          dietary_guidelines?: string | null;
          activity_restrictions?: string | null;
          follow_up_appointments?: Json;
          warning_symptoms?: Json;
          is_verified?: boolean;
          verified_by?: string | null;
          updated_at?: string;
        };
      };

      discharge_translations: {
        Row: {
          id: string;
          organization_id: string;
          instruction_id: string;
          language_code: "es" | "hi" | "zh" | "ar" | "ta";
          translated_content: Json;
          translation_engine: string;
          is_professionally_approved: boolean;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          instruction_id: string;
          language_code: "es" | "hi" | "zh" | "ar" | "ta";
          translated_content: Json;
          translation_engine?: string;
          is_professionally_approved?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          translated_content?: Json;
          is_professionally_approved?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
        };
      };

      professional_attestations: {
        Row: {
          id: string;
          organization_id: string;
          attestor_id: string;
          attestor_role: string;
          license_number: string | null;
          document_version_id: string;
          evidence_chain_hash: string;
          attestation_statement: string;
          is_revoked: boolean;
          revoked_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          attestor_id: string;
          attestor_role: string;
          license_number?: string | null;
          document_version_id: string;
          evidence_chain_hash: string;
          attestation_statement: string;
          is_revoked?: boolean;
          revoked_reason?: string | null;
          created_at?: string;
        };
        Update: {
          is_revoked?: boolean;
          revoked_reason?: string | null;
        };
      };

      audit_logs: {
        Row: {
          id: string;
          organization_id: string | null;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Json;
          client_ip: string | null;
          user_agent: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: Json;
          client_ip?: string | null;
          user_agent?: string | null;
          timestamp?: string;
        };
        Update: never;
      };

      contact_inquiries: {
        Row: {
          id: string;
          name: string;
          email: string;
          organization_name: string;
          role_title: string;
          inquiry_type: "pilot_inquiry" | "research_collaboration" | "security_audit" | "general";
          message: string;
          is_reviewed: boolean;
          reviewed_by: string | null;
          ip_hash: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          organization_name: string;
          role_title: string;
          inquiry_type?: "pilot_inquiry" | "research_collaboration" | "security_audit" | "general";
          message: string;
          is_reviewed?: boolean;
          reviewed_by?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          is_reviewed?: boolean;
          reviewed_by?: string | null;
        };
      };

      consent_records: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          consent_type: "treatment_summary_access" | "research_secondary_use" | "caregiver_proxy_access";
          status: "granted" | "revoked" | "expired";
          granted_by: string;
          valid_until: string | null;
          metadata: Json;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          consent_type: "treatment_summary_access" | "research_secondary_use" | "caregiver_proxy_access";
          status?: "granted" | "revoked" | "expired";
          granted_by: string;
          valid_until?: string | null;
          metadata?: Json;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          status?: "granted" | "revoked" | "expired";
          revoked_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
