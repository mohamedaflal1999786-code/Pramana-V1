export interface NavItem {
  label: string;
  href: string;
}

export interface FeatureItem {
  id: string;
  tag: string;
  title: string;
  description: string;
  isLarge?: boolean;
}

export interface WorkflowStep {
  stepNumber: string;
  title: string;
  description: string;
}

export interface PrincipleRule {
  title: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

// Future Evidence & Safety Provenance Types (Prepared for Phase 02+)
export interface ClinicalEvidenceRecord {
  id: string;
  documentSource: string;
  extractedText: string;
  confidenceScore: number;
  verificationStatus: "unverified" | "verified" | "rejected";
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface SafetyProvenanceNode {
  id: string;
  label: string;
  type: "document" | "extraction" | "rule" | "review";
  metadata?: Record<string, unknown>;
}
