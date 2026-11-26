import { readClinicalSource } from "@/lib/care/source";
/**
 * Pramana-V1 - Reverse Evidence Lineage Tracing Engine
 * Team: Unknown GenZ
 * Phase: 07 — Safety Provenance Graph
 *
 * Implements bidirectional reverse evidence lineage traversal:
 * Clinical Finding -> Reference Rule -> Extracted Entities -> Evidence Spans -> Document Versions
 * Validates verbatim quotes and flags discrepancies.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { IntegrityService } from "./integrity-service";
import type {
  EvidenceLineagePath,
  SPGNode,
  SPGEdge,
  GraphNodeType,
  GraphRelationshipType,
} from "./types";

export class LineageEngine {
  /**
   * Reverses from any clinical finding to reconstruct its full pedigree of evidence
   */
  public static async traceEvidenceLineage(
    findingId: string,
    organizationId: string, patientId?: string
  ): Promise<EvidenceLineagePath> {
    const admin = getSupabaseAdminClient();
    if (!admin) throw new Error("Database admin client unavailable.");

    // 1. Locate Finding Node by either reference_id or node id
    const { data: rawList, error: fErr } = await admin
      .from("evidence_nodes")
      .select("*")
      .eq("organization_id", organizationId)
      .match(patientId ? {patient_id:patientId} : {})
      .or(`reference_id.eq.${findingId},id.eq.${findingId}`)
      .limit(1);

    const findingRaw = rawList?.[0];

    if (fErr || !findingRaw) {
      throw new Error(`Clinical finding node for ${findingId} not found in Safety Provenance Graph.`);
    }

    const findingNode: SPGNode = {
      id: findingRaw.id,
      organizationId: findingRaw.organization_id,
      patientId: findingRaw.patient_id,
      nodeType: findingRaw.node_type as GraphNodeType,
      referenceId: findingRaw.reference_id,
      label: findingRaw.label,
      status: ((findingRaw.metadata as any)?.status as any) || "active",
      metadata: (findingRaw.metadata as any) || {},
      createdAt: findingRaw.created_at,
    };

    // 2. Fetch all edges connected to or from this finding
    const { data: edgesData } = await admin
      .from("evidence_edges")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("patient_id",findingNode.patientId)
      .or(`source_node_id.eq.${findingNode.id},target_node_id.eq.${findingNode.id}`);

    const supportingEdges: SPGEdge[] = [];
    const conflictingEdges: SPGEdge[] = [];
    const entityNodeIds = new Set<string>();
    const spanNodeIds = new Set<string>();
    const reviewNodeIds = new Set<string>();
    let ruleNodeId: string | null = null;

    for (const e of edgesData || []) {
      const edge: SPGEdge = {
        id: e.id,
        organizationId: e.organization_id,
        patientId: e.patient_id,
        sourceNodeId: e.source_node_id,
        targetNodeId: e.target_node_id,
        relationshipType: e.relationship_type as GraphRelationshipType,
        weight: Number(e.weight) || 1.0,
        provenanceNotes: e.provenance_notes || undefined,
        createdAt: e.created_at,
      };

      if (edge.relationshipType === "CONTRADICTS") {
        conflictingEdges.push(edge);
      } else {
        supportingEdges.push(edge);
      }

      // Collect target or source nodes
      if (edge.sourceNodeId === findingNode.id && edge.relationshipType === "EVALUATED_BY") {
        ruleNodeId = edge.targetNodeId;
      }
      if (edge.targetNodeId === findingNode.id && edge.relationshipType === "TRIGGERED") {
        entityNodeIds.add(edge.sourceNodeId);
      }
      if (edge.sourceNodeId === findingNode.id && edge.relationshipType === "SUPPORTED_BY") {
        spanNodeIds.add(edge.targetNodeId);
      }
      if (edge.sourceNodeId === findingNode.id && edge.relationshipType === "REVIEWED_BY") {
        reviewNodeIds.add(edge.targetNodeId);
      }
    }

    // 3. Collect intermediate entity -> span edges
    if (entityNodeIds.size > 0) {
      const { data: entitySpanEdges } = await admin
        .from("evidence_edges")
        .select("*")
        .eq("patient_id",findingNode.patientId).eq("organization_id",organizationId)
        .in("source_node_id", Array.from(entityNodeIds))
        .eq("relationship_type", "SUPPORTED_BY");

      for (const ese of entitySpanEdges || []) {
        spanNodeIds.add(ese.target_node_id);
        supportingEdges.push({
          id: ese.id,
          organizationId: ese.organization_id,
          patientId: ese.patient_id,
          sourceNodeId: ese.source_node_id,
          targetNodeId: ese.target_node_id,
          relationshipType: ese.relationship_type as GraphRelationshipType,
          weight: Number(ese.weight) || 1.0,
          createdAt: ese.created_at,
        });
      }
    }

    // 4. Collect span -> document_version edges
    const documentVersionNodeIds = new Set<string>();
    if (spanNodeIds.size > 0) {
      const { data: spanDocEdges } = await admin
        .from("evidence_edges")
        .select("*")
        .eq("patient_id",findingNode.patientId).eq("organization_id",organizationId)
        .in("source_node_id", Array.from(spanNodeIds))
        .eq("relationship_type", "EXTRACTED_FROM");

      for (const sde of spanDocEdges || []) {
        documentVersionNodeIds.add(sde.target_node_id);
        supportingEdges.push({
          id: sde.id,
          organizationId: sde.organization_id,
          patientId: sde.patient_id,
          sourceNodeId: sde.source_node_id,
          targetNodeId: sde.target_node_id,
          relationshipType: sde.relationship_type as GraphRelationshipType,
          weight: 1.0,
          createdAt: sde.created_at,
        });
      }
    }

    // 5. Fetch all resolved nodes
    const allQueryIds = [
      ruleNodeId,
      ...Array.from(entityNodeIds),
      ...Array.from(spanNodeIds),
      ...Array.from(documentVersionNodeIds),
      ...Array.from(reviewNodeIds),
    ].filter((id): id is string => Boolean(id));

    const { data: fetchedNodes } = await admin
      .from("evidence_nodes")
      .select("*")
      .eq("patient_id",findingNode.patientId).eq("organization_id",organizationId)
      .in("id", allQueryIds);

    let ruleNode: SPGNode | undefined = undefined;
    const entityNodes: SPGNode[] = [];
    const evidenceSpanNodes: SPGNode[] = [];
    const documentVersionNodes: SPGNode[] = [];
    const reviewNodes: SPGNode[] = [];

    for (const raw of fetchedNodes || []) {
      const node: SPGNode = {
        id: raw.id,
        organizationId: raw.organization_id,
        patientId: raw.patient_id,
        nodeType: raw.node_type as GraphNodeType,
        referenceId: raw.reference_id,
        label: raw.label,
        status: ((raw.metadata as any)?.status as any) || "active",
        metadata: (raw.metadata as any) || {},
        createdAt: raw.created_at,
      };

      if (raw.id === ruleNodeId) {
        ruleNode = node;
      } else if (raw.node_type === "evidence_span") {
        evidenceSpanNodes.push(node);
      } else if (raw.node_type === "document_version" || raw.node_type === "clinical_document") {
        documentVersionNodes.push(node);
      } else if (raw.node_type === "clinical_review" || raw.node_type === "professional_attestation") {
        reviewNodes.push(node);
      } else {
        entityNodes.push(node);
      }
    }

    // 6. Verbatim Quote Verification across spans
    let verbatimQuotesMatch = evidenceSpanNodes.length > 0;
    const unresolvedGaps:string[] = [];
    for (const span of evidenceSpanNodes) {
      const id = span.metadata?.documentId;
      if (typeof id !== "string") {verbatimQuotesMatch=false;continue;}
      try {
        const source=await readClinicalSource(id);
        if (source.version.version_number!==span.metadata.versionNumber || typeof span.metadata.rawQuote!=="string" || !span.metadata.rawQuote.trim() || !source.text.includes(span.metadata.rawQuote)) verbatimQuotesMatch=false;
      } catch {verbatimQuotesMatch=false;}
    }
    if (!verbatimQuotesMatch) unresolvedGaps.push("One or more source passages could not be independently verified against the stored version.");
    return {
      findingNode,
      ruleNode,
      entityNodes,
      evidenceSpanNodes,
      documentVersionNodes,
      reviewNodes,
      supportingEdges,
      conflictingEdges,
      verbatimQuotesMatch,
      unresolvedGaps,
    };
  }
}
