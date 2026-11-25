/**
 * Pramana-V1 Clinical Document Intelligence & Extraction Types
 * Team: Unknown GenZ
 *
 * Defines strictly typed structures for multi-format parsing,
 * coordinate-grounded evidence spans, OCR results, FHIR, and HL7 data.
 */

export type SupportedFormat =
  | "pdf"
  | "txt"
  | "jpg"
  | "jpeg"
  | "png"
  | "json"
  | "fhir"
  | "xml"
  | "hl7";

export type ClinicalEntityType =
  | "medication"
  | "condition"
  | "allergy"
  | "lab_value"
  | "procedure"
  | "vital_sign"
  | "dosage_instruction";

export type ReviewStatus =
  | "unverified"
  | "verified"
  | "rejected"
  | "clarification_requested";

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface SourceLocation {
  pageNumber: number;
  charStart?: number;
  charEnd?: number;
  lineNumber?: number;
  jsonPath?: string;
  hl7Segment?: string;
  boundingBox?: BoundingBox;
  confidenceScore?: number;
  isOcrDerived?: boolean;
}

export interface ExtractedEntity {
  id: string;
  entityType: ClinicalEntityType;
  rawText: string;
  normalizedCode?: string; // RxNorm, SNOMED-CT, LOINC, ICD-10
  normalizedName?: string;
  sourceLocation: SourceLocation;
  confidenceScore: number;
  isVerified: boolean;
  reviewStatus: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRationale?: string;
}

export interface ParsedPage {
  pageNumber: number;
  text: string;
  charCount: number;
  isScannedOrImage: boolean;
  ocrConfidence?: number;
}

export interface DocumentExtractionResult {
  success: boolean;
  documentId: string;
  versionNumber: number;
  sha256Hash: string;
  mimeType: string;
  detectedFormat: SupportedFormat;
  totalPages: number;
  pages: ParsedPage[];
  fullText: string;
  entities: ExtractedEntity[];
  extractionMethod: "native_text" | "tesseract_ocr" | "structured_fhir" | "structured_hl7" | "hybrid";
  engineVersion: string;
  processingDurationMs: number;
  errors: string[];
}
