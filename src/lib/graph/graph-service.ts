/**
 * Pramana-V1 - Safety Provenance Graph (SPG) Database Service
 * Team: Unknown GenZ
 * Phase: 07 — Graph Construction & Persistence Engine
 *
 * Implements persistent, typed, version-aware graph operations on Supabase PostgreSQL:
 * - SPG vertex and edge synthesis
 * - Idempotent upserts preventing duplicate graph records
 * - Complete patient-scoped graph retrieval
 * - Strict tenant isolation & foreign key preservation
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { IntegrityService } from "./integrity-service";
import type {
  SPGNode,
  SPGEdge,
  GraphNodeType,
  GraphRelationshipType,
  GraphNodeStatus,
  SafetyProvenanceGraphData,
  EvidenceGroundingCoordinates,
} from "./types";
import type { ExtractedClinicalEntity, ExtractedSafetyFinding } from "@/lib/ai/types";

export class GraphService {
  /**
   * Retrieves the full persistent Safety Provenance Graph for an authorized patient
   */
  public static async getPatientSPG(
    patientId: string,
    organizationId: string
  ): Promise<SafetyProvenanceGraphData> {
    const admin = getSupabaseAdminClient();
    if (!admin) {
      throw new Error("Supabase administration service unavailable for graph retrieval.");
    }

    // 1. Fetch all graph vertices for this patient
    const { data: rawNodes, error: nodesErr } = await admin
      .from("evidence_nodes")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: true });

    if (nodesErr) {
      throw new Error(`Failed to query evidence nodes: ${nodesErr.message}`);
    }

    // 2. Fetch all graph edges for this patient
    const { data: rawEdges, error: edgesErr } = await admin
      .from("evidence_edges")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: true });

    if (edgesErr) {
      throw new Error(`Failed to query evidence edges: ${edgesErr.message}`);
    }

    const nodes: SPGNode[] = (rawNodes || []).map((n) => {
      const meta = (n.metadata as any) || {};
      return {
        id: n.id,
        organizationId: n.organization_id,
        patientId: n.patient_id,
        nodeType: n.node_type as GraphNodeType,
        referenceId: n.reference_id,
        label: n.label,
        status: (meta.status as GraphNodeStatus) || (meta.isStale ? "stale" : "active"),
        metadata: meta,
        createdAt: n.created_at,
        clinicalEventTime: meta.clinicalEventTime,
        effectiveTime: meta.effectiveTime,
      };
    });

    const edges: SPGEdge[] = (rawEdges || []).map((e) => ({
      id: e.id,
      organizationId: e.organization_id,
      patientId: e.patient_id,
      sourceNodeId: e.source_node_id,
      targetNodeId: e.target_node_id,
      relationshipType: e.relationship_type as GraphRelationshipType,
      weight: Number(e.weight) || 1.0,
      provenanceNotes: e.provenance_notes || undefined,
      createdAt: e.created_at,
    }));

    // Compute checksum and summary metrics
    const integrityHash = IntegrityService.computeGraphChecksum(
      nodes.map((n) => ({ id: n.id, label: n.label, status: n.status })),
      edges.map((e) => ({ sourceNodeId: e.sourceNodeId, targetNodeId: e.targetNodeId, relationshipType: e.relationshipType }))
    );

    const activeFindingsCount = nodes.filter(
      (n) => n.nodeType === "clinical_finding" && n.status === "active"
    ).length;
    const staleFindingsCount = nodes.filter(
      (n) => n.nodeType === "clinical_finding" && (n.status === "stale" || n.status === "requires_reassessment")
    ).length;
    const unverifiedCount = nodes.filter(
      (n) => n.nodeType === "clinical_finding" && n.metadata.reviewStatus === "unverified"
    ).length;

    return {
      patientId,
      organizationId,
      nodes,
      edges,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalNodes: nodes.length,
        totalEdges: edges.length,
        activeFindingsCount,
        staleFindingsCount,
        unverifiedCount,
        integrityHash,
      },
    };
  }

  /**
   * Upserts a graph vertex idempotently
   */
  public static async upsertNode(params: {
    id?: string;
    organizationId: string;
    patientId: string;
    nodeType: GraphNodeType;
    referenceId: string;
    label: string;
    status?: GraphNodeStatus;
    metadata?: Record<string, any>;
  }): Promise<SPGNode> {
    const admin = getSupabaseAdminClient();
    if (!admin) throw new Error("Database admin client unavailable.");

    // Check if node already exists for this (patient_id, reference_id, node_type)
    const { data: existing } = await admin
      .from("evidence_nodes")
      .select("*")
      .eq("organization_id", params.organizationId)
      .eq("patient_id", params.patientId)
      .eq("reference_id", params.referenceId)
      .eq("node_type", params.nodeType)
      .maybeSingle();

    const nodeId = existing?.id || params.id || crypto.randomUUID();
    const status = params.status || "active";
    const mergedMetadata = {
      ...((existing?.metadata as any) || {}),
      ...(params.metadata || {}),
      status,
    };

    if (existing) {
      await admin
        .from("evidence_nodes")
        .update({
          label: params.label,
          metadata: mergedMetadata,
        })
        .eq("id", nodeId);
    } else {
      await admin.from("evidence_nodes").insert({
        id: nodeId,
        organization_id: params.organizationId,
        patient_id: params.patientId,
        node_type: params.nodeType as any,
        reference_id: params.referenceId,
        label: params.label,
        metadata: mergedMetadata,
      });
    }

    return {
      id: nodeId,
      organizationId: params.organizationId,
      patientId: params.patientId,
      nodeType: params.nodeType,
      referenceId: params.referenceId,
      label: params.label,
      status,
      metadata: mergedMetadata,
      createdAt: existing?.created_at || new Date().toISOString(),
    };
  }

  /**
   * Upserts a graph edge idempotently
   */
  public static async upsertEdge(params: {
    organizationId: string;
    patientId: string;
    sourceNodeId: string;
    targetNodeId: string;
    relationshipType: GraphRelationshipType;
    weight?: number;
    provenanceNotes?: string;
  }): Promise<SPGEdge> {
    const admin = getSupabaseAdminClient();
    if (!admin) throw new Error("Database admin client unavailable.");

    // Prevent duplicate edges
    const { data: existing } = await admin
      .from("evidence_edges")
      .select("*")
      .eq("organization_id", params.organizationId)
      .eq("patient_id", params.patientId)
      .eq("source_node_id", params.sourceNodeId)
      .eq("target_node_id", params.targetNodeId)
      .eq("relationship_type", params.relationshipType)
      .maybeSingle();

    if (existing) {
      return {
        id: existing.id,
        organizationId: existing.organization_id,
        patientId: existing.patient_id,
        sourceNodeId: existing.source_node_id,
        targetNodeId: existing.target_node_id,
        relationshipType: existing.relationship_type as GraphRelationshipType,
        weight: Number(existing.weight) || 1.0,
        provenanceNotes: existing.provenance_notes || undefined,
        createdAt: existing.created_at,
      };
    }

    const edgeId = crypto.randomUUID();
    const { data: inserted, error } = await admin
      .from("evidence_edges")
      .insert({
        id: edgeId,
        organization_id: params.organizationId,
        patient_id: params.patientId,
        source_node_id: params.sourceNodeId,
        target_node_id: params.targetNodeId,
        relationship_type: params.relationshipType as any,
        weight: params.weight !== undefined ? params.weight : 1.0,
        provenance_notes: params.provenanceNotes || null,
      })
      .select()
      .single();

    if (error || !inserted) {
      throw new Error(`Failed to create graph edge: ${error?.message}`);
    }

    return {
      id: inserted.id,
      organizationId: inserted.organization_id,
      patientId: inserted.patient_id,
      sourceNodeId: inserted.source_node_id,
      targetNodeId: inserted.target_node_id,
      relationshipType: inserted.relationship_type as GraphRelationshipType,
      weight: Number(inserted.weight) || 1.0,
      provenanceNotes: inserted.provenance_notes || undefined,
      createdAt: inserted.created_at,
    };
  }

  /**
   * Constructs the complete provenance graph for a newly analyzed clinical document
   */
  public static async constructSPGFromAnalysis(params: {
    patientId: string;
    organizationId: string;
    documentId: string;
    documentVersionId: string;
    documentTitle: string;
    versionNumber: number;
    rawText: string;
    entities: ExtractedClinicalEntity[];
    safetyFindings: ExtractedSafetyFinding[];
  }): Promise<{ nodesCreated: number; edgesCreated: number }> {
    let nodesCount = 0;
    let edgesCount = 0;

    // 1. Clinical Document Node
    const docNode = await this.upsertNode({
      organizationId: params.organizationId,
      patientId: params.patientId,
      nodeType: "clinical_document",
      referenceId: params.documentId,
      label: params.documentTitle,
      metadata: {
        documentId: params.documentId,
        title: params.documentTitle,
        totalVersions: params.versionNumber,
      },
    });
    nodesCount++;

    // 2. Document Version Node
    const docSha256 = IntegrityService.computeSha256(params.rawText);
    const versionNode = await this.upsertNode({
      organizationId: params.organizationId,
      patientId: params.patientId,
      nodeType: "document_version",
      referenceId: params.documentVersionId,
      label: `${params.documentTitle} (v${params.versionNumber})`,
      metadata: {
        documentId: params.documentId,
        versionNumber: params.versionNumber,
        sha256Hash: docSha256,
        charCount: params.rawText.length,
      },
    });
    nodesCount++;

    // Edge: document_version -> DOCUMENTED_IN -> clinical_document
    await this.upsertEdge({
      organizationId: params.organizationId,
      patientId: params.patientId,
      sourceNodeId: versionNode.id,
      targetNodeId: docNode.id,
      relationshipType: "DOCUMENTED_IN",
      provenanceNotes: `Version ${params.versionNumber} of document`,
    });
    edgesCount++;

    // 3. Extracted Clinical Entities & Evidence Spans
    const entityNodeMap = new Map<string, SPGNode>();
    const spanNodeMap = new Map<string, SPGNode>();

    for (const ent of params.entities) {
      // Create Evidence Span Node
      const quote = ent.sourceLocation.rawQuote;
      const charStart = ent.sourceLocation.startOffset ?? 0;
      const charEnd = ent.sourceLocation.endOffset ?? quote.length;
      const spanHash = IntegrityService.hashEvidenceSpan(
        quote,
        charStart,
        charEnd,
        params.documentId
      );

      const spanReferenceId = crypto.randomUUID();
      const spanNode = await this.upsertNode({
        organizationId: params.organizationId,
        patientId: params.patientId,
        nodeType: "evidence_span",
        referenceId: spanReferenceId,
        label: `Quote: "${quote.slice(0, 36)}${quote.length > 36 ? "..." : ""}"`,
        metadata: {
          quote,
          charStart,
          charEnd,
          page: ent.sourceLocation.pageNumber || 1,
          documentId: params.documentId,
          versionNumber: params.versionNumber,
          sha256Hash: spanHash,
        },
      });
      nodesCount++;
      spanNodeMap.set(quote, spanNode);

      // Edge: evidence_span -> EXTRACTED_FROM -> document_version
      await this.upsertEdge({
        organizationId: params.organizationId,
        patientId: params.patientId,
        sourceNodeId: spanNode.id,
        targetNodeId: versionNode.id,
        relationshipType: "EXTRACTED_FROM",
        provenanceNotes: `Character span [${charStart}:${charEnd}]`,
      });
      edgesCount++;

      // Create Extracted Entity Node (Medication, Allergy, Condition, Lab)
      const entityNode = await this.upsertNode({
        organizationId: params.organizationId,
        patientId: params.patientId,
        nodeType:
          ent.entityType === "medication"
            ? "medication_record"
            : ent.entityType === "allergy"
            ? "documented_allergy"
            : ent.entityType === "lab_result"
            ? "lab_observation"
            : "extracted_entity",
        referenceId: ent.id,
        label: `${ent.name}${ent.dosage ? ` (${ent.dosage})` : ""}`,
        metadata: {
          name: ent.name,
          entityType: ent.entityType,
          dosage: ent.dosage,
          frequency: ent.frequency,
          route: ent.route,
          status: ent.status,
          normalizedCode: ent.normalizedCode,
          confidenceScore: ent.confidenceScore,
        },
      });
      nodesCount++;
      entityNodeMap.set(ent.id, entityNode);

      // Edge: extracted_entity -> SUPPORTED_BY -> evidence_span
      await this.upsertEdge({
        organizationId: params.organizationId,
        patientId: params.patientId,
        sourceNodeId: entityNode.id,
        targetNodeId: spanNode.id,
        relationshipType: "SUPPORTED_BY",
        weight: ent.confidenceScore || 1.0,
      });
      edgesCount++;
    }

    // 4. Reference Rules and Safety Findings
    for (const finding of params.safetyFindings) {
      // Create Reference Rule Node
      const ruleRefId = crypto.randomUUID();
      const ruleNode = await this.upsertNode({
        organizationId: params.organizationId,
        patientId: params.patientId,
        nodeType: "reference_rule",
        referenceId: ruleRefId,
        label: `Rule: ${finding.ruleCode}`,
        metadata: {
          ruleCode: finding.ruleCode,
          severity: finding.severity,
          clinicalRationale: finding.clinicalRationale,
          referenceSource: finding.referenceSource,
        },
      });
      nodesCount++;

      // Create Clinical Finding Node (Safety Alert)
      const findingNode = await this.upsertNode({
        id: finding.id,
        organizationId: params.organizationId,
        patientId: params.patientId,
        nodeType: "clinical_finding",
        referenceId: finding.id,
        label: finding.title,
        status: "active",
        metadata: {
          findingId: finding.id,
          title: finding.title,
          summary: finding.summary,
          severity: finding.severity,
          ruleCode: finding.ruleCode,
          clinicalRationale: finding.clinicalRationale,
          referenceSource: finding.referenceSource,
          reviewStatus: "unverified",
          isStale: false,
        },
      });
      nodesCount++;

      // Edge: clinical_finding -> EVALUATED_BY -> reference_rule
      await this.upsertEdge({
        organizationId: params.organizationId,
        patientId: params.patientId,
        sourceNodeId: findingNode.id,
        targetNodeId: ruleNode.id,
        relationshipType: "EVALUATED_BY",
      });
      edgesCount++;

      // Edge: clinical_finding -> TRIGGERED -> (triggering entities)
      for (const ent of params.entities) {
        const entNode = entityNodeMap.get(ent.id);
        if (entNode && finding.summary.toLowerCase().includes(ent.name.toLowerCase())) {
          await this.upsertEdge({
            organizationId: params.organizationId,
            patientId: params.patientId,
            sourceNodeId: entNode.id,
            targetNodeId: findingNode.id,
            relationshipType: "TRIGGERED",
          });
          edgesCount++;
        }
      }

      // Edge: clinical_finding -> SUPPORTED_BY -> (evidence spans)
      for (const span of finding.supportingSpans) {
        const spanNode = spanNodeMap.get(span.rawQuote);
        if (spanNode) {
          await this.upsertEdge({
            organizationId: params.organizationId,
            patientId: params.patientId,
            sourceNodeId: findingNode.id,
            targetNodeId: spanNode.id,
            relationshipType: "SUPPORTED_BY",
          });
          edgesCount++;
        }
      }
    }

    return { nodesCreated: nodesCount, edgesCreated: edgesCount };
  }
}
