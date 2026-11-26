/**
 * Pramana-V1 - Gemini AI Clinical Intelligence Core Types
 * Team: Unknown GenZ
 *
 * Strict TypeScript models for:
 * - Evidence-Grounded Entity Extraction
 * - Deterministic Safety Rules
 * - Cross-Document Contradiction Detection
 * - Missing Evidence Intelligence
 * - Clinical Handoff Verification
 * - Multilingual Discharge Guidance
 * - Provenance Coordinates & Hallucination Prevention
 */

export type ClinicalEntityType =
  | "medication"
  | "allergy"
  | "condition"
  | "lab_result"
  | "vital_sign"
  | "procedure"
  | "observation"
  | "instruction";

export type MedicationStatus = "current" | "historical" | "discontinued" | "proposed" | "unknown";

export type FindingSeverity = "critical" | "high" | "moderate" | "low" | "informational";

export type FindingReviewStatus =
  | "unverified"
  | "endorsed"
  | "rejected"
  | "clarification_requested"
  | "superseded";

export type MissingEvidenceCategory =
  | "missing_dosage"
  | "missing_allergy_status"
  | "pending_investigation_without_followup"
  | "discharge_without_responsible_clinician"
  | "unresolved_record_conflict"
  | "unspecified_frequency";

export type MissingEvidenceType =
  | "explicitly_absent"
  | "not_documented"
  | "unreadable"
  | "conflicting"
  | "not_applicable";

export type SupportedLanguage =
  | "en" // English
  | "ta" // Tamil
  | "hi" // Hindi
  | "te" // Telugu
  | "ml" // Malayalam
  | "kn" // Kannada
  | "es" // Spanish
  | "ar" // Arabic
  | "zh"; // Mandarin

export interface EvidenceSourceLocation {
  documentId: string;
  versionNumber: number;
  pageNumber?: number;
  lineOffset?: number;
  startOffset?: number;
  endOffset?: number;
  rawQuote: string;
  jsonPath?: string;
  hl7Segment?: string;
  spanId?: string;
}

export interface ExtractedClinicalEntity {
  id: string;
  entityType: ClinicalEntityType;
  name: string;
  normalizedCode?: string; // RxNorm / SNOMED CT / LOINC
  dosage?: string;
  dosageUnit?: string;
  frequency?: string;
  route?: string;
  startDate?: string;
  endDate?: string;
  status: MedicationStatus;
  isNegated: boolean; // e.g. "No known drug allergies", "Denies chest pain"
  uncertaintyNotes?: string;
  sourceLocation: EvidenceSourceLocation;
  confidenceScore?: number;
}

export interface DeterministicSafetyRule {
  ruleCode: string;
  name: string;
  category: "drug_interaction" | "contraindication" | "dosage_limit" | "allergy_conflict";
  severity: FindingSeverity;
  description: string;
  clinicalRationale: string;
  referenceSource: string; // e.g., "FDA Drug Label / RxNorm 2026.1"
  referenceVersion: string;
  applicableConditions: string[];
  knownLimitations: string;
}

export interface SafetyFinding {
  id: string;
  ruleCode: string;
  severity: FindingSeverity;
  title: string;
  summary: string;
  clinicalRationale: string;
  referenceSource: string;
  evidenceNodeIds: string[];
  supportingSpans: EvidenceSourceLocation[];
  reviewStatus: FindingReviewStatus;
  isDeterministic: boolean;
  modelConfidence?: number;
}

export type ExtractedSafetyFinding = SafetyFinding;

export interface ClinicalContradiction {
  id: string;
  findingDescription: string;
  entityName: string;
  sourceA: {
    documentTitle: string;
    timestamp: string;
    value: string;
    location: EvidenceSourceLocation;
  };
  sourceB: {
    documentTitle: string;
    timestamp: string;
    value: string;
    location: EvidenceSourceLocation;
  };
  discrepancyReason: string;
  isLegitimateChange: boolean; // True if chronology explains difference (e.g. dose escalated)
  reviewStatus: FindingReviewStatus;
}

export interface MissingEvidenceFinding {
  id: string;
  category: MissingEvidenceCategory;
  missingType: MissingEvidenceType;
  description: string;
  relatedEntityName?: string;
  recommendedClarification: string;
  reviewStatus: FindingReviewStatus;
}

export interface HandoffOmissionItem {
  id: string;
  category: "allergy" | "medication" | "pending_lab" | "code_status" | "followup_task";
  item: string;
  sourceEvidence: EvidenceSourceLocation;
  handoffSummaryMention: string | null;
  isOmitted: boolean;
  reviewedByClinician: boolean;
}

export interface MultilingualDischargeDraft {
  id: string;
  patientId: string;
  targetLanguage: SupportedLanguage;
  targetLanguageLabel: string;
  originalInstructions: string;
  translatedInstructions: string;
  validatedMedications: {
    original: string;
    translated: string;
    dosagePreserved: boolean;
    frequencyPreserved: boolean;
  }[];
  warningSymptoms: string[];
  dietaryGuidelines?: string;
  activityRestrictions?: string;
  isClinicianApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface AiUsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  processingDurationMs: number;
  modelVersion: string;
}

export interface AiAnalysisJobResult {
  jobId: string;
  documentId: string;
  patientId: string;
  success: boolean;
  extractedEntities: ExtractedClinicalEntity[];
  safetyFindings: SafetyFinding[];
  contradictions: ClinicalContradiction[];
  missingEvidence: MissingEvidenceFinding[];
  usage: AiUsageMetrics;
  error?: string;
}
