/**
 * Pramana-V1 - Dynamic Evidence Invalidation Engine
 * Team: Unknown GenZ
 * Phase: 07 — Flagship Core Engine
 *
 * Implements automated, version-aware evidence invalidation:
 * 1. Preserves original document version and historical analysis.
 * 2. Traverses forward impact to identify all dependent entities, findings, and reviews.
 * 3. Marks affected findings as 'stale' or 'requires_reassessment'.
 * 4. Creates invalidation_events audit record and reassessment_jobs for clinical review.
 * 5. Generates typed 'SUPERSEDES' and 'INVALIDATES' graph edges.
 * 6. Captures historical graph snapshot before state mutation.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { GraphService } from "./graph-service";
import { ImpactAnalyzer } from "./impact-analyzer";
import { IntegrityService } from "./integrity-service";
import type { DynamicInvalidationResult } from "./types";

export class InvalidationEngine {
  /**
   * Invalidates evidence dependencies when a document version is superseded or corrected
   */
  public static async invalidateDocumentVersion(params: {
    organizationId: string;
    patientId: string;
    oldDocumentVersionId: string;
    newDocumentVersionId: string;
    reason: string;
    actorId?: string;
  }): Promise<DynamicInvalidationResult> {
    const admin = getSupabaseAdminClient();
    if (!admin) throw new Error("Database admin client unavailable.");

    // 1. Locate Old and New Document Version Nodes in SPG
    const { data: oldNodeRaw } = await admin
      .from("evidence_nodes")
      .select("*")
      .eq("organization_id", params.organizationId)
      .eq("patient_id", params.patientId)
      .eq("reference_id", params.oldDocumentVersionId)
      .maybeSingle();

    const { data: newNodeRaw } = await admin
      .from("evidence_nodes")
      .select("*")
      .eq("organization_id", params.organizationId)
      .eq("patient_id", params.patientId)
      .eq("reference_id", params.newDocumentVersionId)
      .maybeSingle();

    if (!oldNodeRaw) {
      throw new Error(`Previous document version node ${params.oldDocumentVersionId} not found in graph.`);
    }

    // 2. Capture a Graph Snapshot BEFORE mutation for historical replay
    const currentGraph = await GraphService.getPatientSPG(params.patientId, params.organizationId);
    const snapshotId = crypto.randomUUID();
    const snapshotHash = IntegrityService.computeGraphChecksum(
      currentGraph.nodes.map((n) => ({ id: n.id, label: n.label, status: n.status })),
      currentGraph.edges.map((e) => ({ sourceNodeId: e.sourceNodeId, targetNodeId: e.targetNodeId, relationshipType: e.relationshipType }))
    );

    try {
      await admin.from("graph_snapshots" as any).insert({
        id: snapshotId,
        organization_id: params.organizationId,
        patient_id: params.patientId,
        version_number: currentGraph.nodes.length,
        trigger_event: "document_superseded",
        trigger_reference_id: params.oldDocumentVersionId,
        snapshot_data: {
          nodes: currentGraph.nodes,
          edges: currentGraph.edges,
        },
        node_count: currentGraph.nodes.length,
        edge_count: currentGraph.edges.length,
        sha256_hash: snapshotHash,
        created_by: params.actorId || null,
      });
    } catch (e: any) {
      console.warn("[InvalidationEngine] Graph snapshot insert note:", e.message);
    }

    // 3. Traverse Forward Impact from Old Version Node
    const impact = await ImpactAnalyzer.runForwardImpactAnalysis(
      oldNodeRaw.id,
      params.organizationId
    );

    const invalidatedFindingIds: string[] = [];
    const reassessmentJobIds: string[] = [];
    const affectedReviewIds: string[] = [];

    // 4. Mark all affected Clinical Finding Nodes as 'requires_reassessment' / 'stale'
    for (const findingNode of impact.affectedFindings) {
      invalidatedFindingIds.push(findingNode.referenceId);

      // Update node in evidence_nodes
      await admin
        .from("evidence_nodes")
        .update({
          metadata: {
            ...(typeof findingNode.metadata === "object" && findingNode.metadata ? (findingNode.metadata as any) : {}),
            status: "requires_reassessment",
            isStale: true,
            invalidationReason: params.reason,
            invalidatedAt: new Date().toISOString(),
          },
        })
        .eq("id", findingNode.id);

      // Update safety_alerts record
      await admin
        .from("safety_alerts")
        .update({
          status: "pending_review",
          updated_at: new Date().toISOString(),
        })
        .eq("id", findingNode.referenceId);

      // Create Reassessment Job
      const jobId = crypto.randomUUID();
      reassessmentJobIds.push(jobId);

      try {
        await admin.from("reassessment_jobs" as any).insert({
          id: jobId,
          organization_id: params.organizationId,
          patient_id: params.patientId,
          finding_id: findingNode.referenceId,
          status: "pending",
          reassessment_notes: `Auto-generated reassessment required. ${params.reason}`,
        });
      } catch (err: any) {
        console.warn("[InvalidationEngine] Reassessment job insert note:", err.message);
      }
    }

    // 5. Mark affected Reviews as stale
    for (const revNode of impact.affectedReviews) {
      affectedReviewIds.push(revNode.id);
      await admin
        .from("evidence_nodes")
        .update({
          metadata: {
            ...(typeof revNode.metadata === "object" && revNode.metadata ? (revNode.metadata as any) : {}),
            status: "stale",
            invalidationReason: "Underlying source evidence has been superseded.",
          },
        })
        .eq("id", revNode.id);
    }

    // 6. Mark Old Document Version Node as 'superseded'
    await admin
      .from("evidence_nodes")
      .update({
        metadata: {
          ...(typeof oldNodeRaw.metadata === "object" && oldNodeRaw.metadata ? (oldNodeRaw.metadata as any) : {}),
          status: "superseded",
          supersededAt: new Date().toISOString(),
          supersededById: params.newDocumentVersionId,
        },
      })
      .eq("id", oldNodeRaw.id);

    // 7. Generate Typed Edges: SUPERSEDES & INVALIDATES
    let createdEdgesCount = 0;
    if (newNodeRaw) {
      // Edge: new_version -> SUPERSEDES -> old_version
      await GraphService.upsertEdge({
        organizationId: params.organizationId,
        patientId: params.patientId,
        sourceNodeId: newNodeRaw.id,
        targetNodeId: oldNodeRaw.id,
        relationshipType: "SUPERSEDES",
        provenanceNotes: params.reason,
      });
      createdEdgesCount++;

      // Edge: new_version -> INVALIDATES -> (each stale finding)
      for (const finding of impact.affectedFindings) {
        await GraphService.upsertEdge({
          organizationId: params.organizationId,
          patientId: params.patientId,
          sourceNodeId: newNodeRaw.id,
          targetNodeId: finding.id,
          relationshipType: "INVALIDATES",
          provenanceNotes: `Source evidence updated: ${params.reason}`,
        });
        createdEdgesCount++;
      }
    }

    // 8. Record Invalidation Event in Audit Table
    const invalidationEventId = crypto.randomUUID();
    const auditHash = IntegrityService.computeSha256(
      `INVALIDATE|old:${params.oldDocumentVersionId}|new:${params.newDocumentVersionId}|findings:${invalidatedFindingIds.join(",")}`
    );

    try {
      await admin.from("invalidation_events" as any).insert({
        id: invalidationEventId,
        organization_id: params.organizationId,
        patient_id: params.patientId,
        source_type: "document_version",
        source_id: params.oldDocumentVersionId,
        superseded_by_id: params.newDocumentVersionId,
        reason: params.reason,
        affected_finding_ids: invalidatedFindingIds,
        affected_review_ids: affectedReviewIds,
        status: "completed",
        sha256_hash: auditHash,
      });
    } catch (err: any) {
      console.warn("[InvalidationEngine] Invalidation event insert note:", err.message);
    }

    return {
      invalidationEventId,
      patientId: params.patientId,
      sourceDocumentVersionId: params.oldDocumentVersionId,
      supersedingDocumentVersionId: params.newDocumentVersionId,
      reason: params.reason,
      invalidatedFindingIds,
      reassessmentJobIds,
      affectedReviewIds,
      createdEdgesCount,
      auditHash,
      timestamp: new Date().toISOString(),
    };
  }
}
