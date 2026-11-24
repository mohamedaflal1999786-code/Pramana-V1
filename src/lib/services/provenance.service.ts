/**
 * Pramana-V1 Safety Provenance Graph Service
 * Team: Unknown GenZ
 *
 * Manages evidence nodes, edges, and provenance chain integrity verification.
 * Chain: Document -> Document Version -> Source Location -> Extracted Entity -> Versioned Rule -> Discrepancy -> Review -> Attestation.
 */

import crypto from "crypto";
import type {
  Database,
  ProvenanceNodeType,
  ProvenanceEdgeType,
} from "@/types/database.types";

export interface EvidenceNodeData {
  organizationId: string;
  patientId: string;
  nodeType: ProvenanceNodeType;
  referenceId: string;
  label: string;
  metadata: {
    documentId?: string;
    versionNumber?: number;
    pageNumber?: number;
    charStart?: number;
    charEnd?: number;
    sourceQuotation?: string;
    ruleCode?: string;
    boundingCoordinates?: { x: number; y: number; width: number; height: number } | null;
  };
}

export interface ProvenanceChainSummary {
  documentVersionId: string;
  sha256Hash: string;
  nodeCount: number;
  edgeCount: number;
  isComplete: boolean;
  unverifiedNodes: string[];
  chainIntegrityHash: string;
}

/**
 * Computes deterministic SHA-256 integrity hash for an evidence chain.
 * Note: Integrity checking guarantees data structure consistency,
 * distinct from a legally binding electronic signature.
 */
export function computeEvidenceChainHash(nodeIds: string[], hashes: string[]): string {
  const combined = [...nodeIds, ...hashes].sort().join("::");
  return crypto.createHash("sha256").update(combined).digest("hex");
}
