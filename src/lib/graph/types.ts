/**
 * Pramana-V1 - Safety Provenance Graph (SPG) Core Data Contracts
 * Team: Unknown GenZ
 * Phase: 07 — Evidence Lineage & Dynamic Clinical Safety Intelligence
 *
 * Strict TypeScript types for:
 * - Versioned Graph Nodes & Typed Edges
 * - Bidirectional Lineage Traversal (Reverse Tracing & Forward Impact)
 * - Dynamic Invalidation & Reassessment Queues
 * - Cryptographic Evidence Integrity (SHA-256)
 * - Counterfactual Simulation (Isolated Research Mode)
 * - Historical Replay & Temporal Graph Evolution
 */

export type GraphNodeType =
  | "clinical_document"
  | "document_version"
  | "evidence_span"
  | "extracted_entity"
  | "medication_record"
  | "documented_allergy"
  | "lab_observation"
  | "reference_rule"
  | "clinical_finding"
  | "missing_evidence"
  | "clinical_review"
  | "discharge_draft"
  | "analysis_run";

export type GraphRelationshipType =
  | "EXTRACTED_FROM"
  | "DOCUMENTED_IN"
  | "SUPPORTED_BY"
  | "CONTRADICTS"
  | "EVALUATED_BY"
  | "TRIGGERED"
  | "REQUIRES_EVIDENCE"
  | "REVIEWED_BY"
  | "SUPERSEDES"
  | "INVALIDATES"
  | "DERIVED_FROM"
  | "RESOLVED_BY";

export type GraphNodeStatus =
  | "active"
  | "stale"
  | "superseded"
  | "invalidated"
  | "requires_reassessment"
  | "simulated";

export type FindingSeverity = "critical" | "high" | "moderate" | "low" | "informational";

export type FindingReviewStatus =
  | "unverified"
  | "endorsed"
  | "rejected"
  | "clarification_requested"
  | "superseded";

export interface EvidenceGroundingCoordinates {
  quote: string;
  charStart: number;
  charEnd: number;
  page?: number;
  documentId: string;
  documentTitle: string;
  versionNumber: number;
  sha256Hash?: string;
  method?: "regex_span" | "ocr_span" | "fhir_path" | "hl7_segment";
}

export interface SPGNodeMetadata {
  status?: GraphNodeStatus;
  quote?: string;
  charStart?: number;
  charEnd?: number;
  page?: number;
  documentId?: string;
  documentTitle?: string;
  versionNumber?: number;
  sha256Hash?: string;
  extractionMethod?: string;
  ruleCode?: string;
  severity?: FindingSeverity;
  reviewStatus?: FindingReviewStatus;
  clinicalRationale?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewTimestamp?: string;
  clinicalEventTime?: string;
  effectiveTime?: string;
  isStale?: boolean;
  invalidationReason?: string;
  missingCategory?: string;
  contradictionReason?: string;
  [key: string]: any;
}

export interface SPGNode {
  id: string;
  organizationId: string;
  patientId: string;
  nodeType: GraphNodeType;
  referenceId: string;
  label: string;
  status: GraphNodeStatus;
  metadata: SPGNodeMetadata;
  createdAt: string;
  clinicalEventTime?: string;
  effectiveTime?: string;
}

export interface SPGEdge {
  id: string;
  organizationId: string;
  patientId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: GraphRelationshipType;
  weight: number;
  provenanceNotes?: string;
  createdAt: string;
}

export interface SafetyProvenanceGraphData {
  patientId: string;
  organizationId: string;
  nodes: SPGNode[];
  edges: SPGEdge[];
  metadata: {
    generatedAt: string;
    totalNodes: number;
    totalEdges: number;
    activeFindingsCount: number;
    staleFindingsCount: number;
    unverifiedCount: number;
    integrityHash: string;
  };
}

/**
 * Complete Reverse Evidence Lineage Traversal
 * Traceability: Finding -> Rule -> Entity -> Evidence Span -> Document Version
 */
export interface EvidenceLineagePath {
  findingNode: SPGNode;
  ruleNode?: SPGNode;
  entityNodes: SPGNode[];
  evidenceSpanNodes: SPGNode[];
  documentVersionNodes: SPGNode[];
  reviewNodes: SPGNode[];
  supportingEdges: SPGEdge[];
  conflictingEdges: SPGEdge[];
  verbatimQuotesMatch: boolean;
  unresolvedGaps: string[];
}

/**
 * Forward Impact Analysis Result
 * Downstream dependency graph traversal
 */
export interface ForwardImpactResult {
  sourceNodeId: string;
  sourceNodeType: GraphNodeType;
  sourceLabel: string;
  affectedEntities: SPGNode[];
  affectedFindings: SPGNode[];
  affectedReviews: SPGNode[];
  affectedDischargeDrafts: SPGNode[];
  dependencyChains: Array<{
    targetNode: SPGNode;
    path: string[];
    depth: number;
    invalidationReason: string;
  }>;
  totalAffectedCount: number;
  requiresReassessmentCount: number;
}

/**
 * Dynamic Evidence Invalidation
 */
export interface DynamicInvalidationResult {
  invalidationEventId: string;
  patientId: string;
  sourceDocumentVersionId: string;
  supersedingDocumentVersionId: string;
  reason: string;
  invalidatedFindingIds: string[];
  reassessmentJobIds: string[];
  affectedReviewIds: string[];
  createdEdgesCount: number;
  auditHash: string;
  timestamp: string;
}

/**
 * Isolated Counterfactual Evidence Simulation
 */
export interface CounterfactualScenario {
  id: string;
  patientId: string;
  scenarioName: string;
  hypothesisType:
    | "correct_entity_dosage"
    | "supersede_document"
    | "resolve_allergy_conflict"
    | "supply_missing_evidence";
  description: string;
  hypotheticalChanges: {
    targetNodeId?: string;
    entityName?: string;
    oldValue?: any;
    newValue?: any;
    simulatedDocumentText?: string;
  };
  simulatedAt: string;
}

export interface SimulationResult {
  scenario: CounterfactualScenario;
  originalFindings: SPGNode[];
  simulatedFindings: SPGNode[];
  resolvedFindings: SPGNode[];
  newAlertsTriggered: SPGNode[];
  unchangedFindings: SPGNode[];
  impactSummary: string;
}

/**
 * Historical Graph Snapshot for Replay
 */
export interface GraphSnapshotRecord {
  id: string;
  patientId: string;
  versionNumber: number;
  triggerEvent: string;
  triggerReferenceId?: string;
  nodeCount: number;
  edgeCount: number;
  sha256Hash: string;
  createdAt: string;
  snapshotData: {
    nodes: SPGNode[];
    edges: SPGEdge[];
  };
}
