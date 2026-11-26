/**
 * Pramana-V1 - Forward Impact & Dependency Traversal Engine
 * Team: Unknown GenZ
 * Phase: 07 — Safety Provenance Graph
 *
 * Implements downstream dependency traversal with bounded cycle-safe search:
 * Document Version / Evidence Span / Rule -> Extracted Entities -> Clinical Findings -> Reviews -> Discharges
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  ForwardImpactResult,
  SPGNode,
  SPGEdge,
  GraphNodeType,
  GraphRelationshipType,
} from "./types";

export class ImpactAnalyzer {
  /**
   * Identifies all downstream clinical artifacts dependent on a given source node
   */
  public static async runForwardImpactAnalysis(
    sourceNodeId: string,
    organizationId: string,
    maxDepth = 6, patientId?: string
  ): Promise<ForwardImpactResult> {
    const admin = getSupabaseAdminClient();
    if (!admin) throw new Error("Database admin client unavailable.");

    // 1. Fetch Source Node
    const { data: sourceRaw, error: sErr } = await admin
      .from("evidence_nodes")
      .select("*")
      .eq("organization_id", organizationId)
      .match(patientId ? {patient_id:patientId} : {})
      .eq("id", sourceNodeId)
      .maybeSingle();

    if (sErr || !sourceRaw) {
      throw new Error(`Source node ${sourceNodeId} not found in Safety Provenance Graph.`);
    }

    const sourceNode: SPGNode = {
      id: sourceRaw.id,
      organizationId: sourceRaw.organization_id,
      patientId: sourceRaw.patient_id,
      nodeType: sourceRaw.node_type as GraphNodeType,
      referenceId: sourceRaw.reference_id,
      label: sourceRaw.label,
      status: ((sourceRaw.metadata as any)?.status as any) || "active",
      metadata: (sourceRaw.metadata as any) || {},
      createdAt: sourceRaw.created_at,
    };

    // 2. Fetch all edges for this patient to build an in-memory adjacency list
    const { data: rawEdges } = await admin
      .from("evidence_edges")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("patient_id", sourceNode.patientId);

    // Forward adjacency graph (source -> targets)
    // Note: depending on relationship orientation:
    // doc_version <- EXTRACTED_FROM - span <- SUPPORTED_BY - entity -> TRIGGERED -> finding -> REVIEWED_BY -> review
    // To trace forward impact from a doc/version/span:
    // We treat edges that link downstream as directed dependencies.
    const forwardAdj = new Map<string, Array<{ targetId: string; type: string }>>();

    const addForward = (u: string, v: string, rel: string) => {
      if (!forwardAdj.has(u)) forwardAdj.set(u, []);
      forwardAdj.get(u)!.push({ targetId: v, type: rel });
    };

    for (const e of rawEdges || []) {
      const { source_node_id: s, target_node_id: t, relationship_type: rel } = e;

      // In the SPG:
      // - span is EXTRACTED_FROM version => change in version impacts span (version -> span)
      // - entity is SUPPORTED_BY span => change in span impacts entity (span -> entity)
      // - entity TRIGGERED finding => change in entity impacts finding (entity -> finding)
      // - finding is SUPPORTED_BY span => change in span impacts finding (span -> finding)
      // - finding is EVALUATED_BY rule => change in rule impacts finding (rule -> finding)
      // - finding is REVIEWED_BY review => change in finding impacts review (finding -> review)
      // - discharge is DERIVED_FROM finding/doc => change impacts discharge
      if (rel === "EXTRACTED_FROM") {
        addForward(t, s, rel); // doc_version -> span
      } else if (rel === "SUPPORTED_BY") {
        addForward(t, s, rel); // span -> entity or span -> finding
      } else if (rel === "TRIGGERED") {
        addForward(s, t, rel); // entity -> finding
      } else if (rel === "EVALUATED_BY") {
        addForward(t, s, rel); // rule -> finding
      } else if (rel === "REVIEWED_BY") {
        addForward(s, t, rel); // finding -> review
      } else if (rel === "DERIVED_FROM") {
        addForward(t, s, rel); // doc/finding -> discharge
      } else {
        addForward(s, t, rel);
      }
    }

    // 3. Cycle-safe Breadth-First / Depth-First Traversal
    const visited = new Set<string>([sourceNodeId]);
    const queue: Array<{ nodeId: string; path: string[]; depth: number }> = [
      { nodeId: sourceNodeId, path: [sourceNode.label], depth: 0 },
    ];

    const discoveredNodeIds: Array<{ id: string; path: string[]; depth: number }> = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;

      const neighbors = forwardAdj.get(current.nodeId) || [];
      for (const n of neighbors) {
        if (!visited.has(n.targetId)) {
          visited.add(n.targetId);
          const nextDepth = current.depth + 1;
          const nextItem = {
            nodeId: n.targetId,
            path: [...current.path, n.type],
            depth: nextDepth,
          };
          discoveredNodeIds.push({ id: n.targetId, path: nextItem.path, depth: nextDepth });
          queue.push(nextItem);
        }
      }
    }

    // 4. Fetch details for all discovered affected nodes
    const affectedNodeIds = discoveredNodeIds.map((d) => d.id);
    let affectedNodesData: any[] = [];

    if (affectedNodeIds.length > 0) {
      const { data: nodesData } = await admin
        .from("evidence_nodes")
        .select("*")
        .eq("organization_id",organizationId).eq("patient_id",sourceNode.patientId)
        .in("id", affectedNodeIds);
      affectedNodesData = nodesData || [];
    }

    const nodeById = new Map<string, SPGNode>();
    for (const raw of affectedNodesData) {
      nodeById.set(raw.id, {
        id: raw.id,
        organizationId: raw.organization_id,
        patientId: raw.patient_id,
        nodeType: raw.node_type as GraphNodeType,
        referenceId: raw.reference_id,
        label: raw.label,
        status: ((raw.metadata as any)?.status as any) || "active",
        metadata: (raw.metadata as any) || {},
        createdAt: raw.created_at,
      });
    }

    const affectedEntities: SPGNode[] = [];
    const affectedFindings: SPGNode[] = [];
    const affectedReviews: SPGNode[] = [];
    const affectedDischargeDrafts: SPGNode[] = [];
    const dependencyChains: Array<{
      targetNode: SPGNode;
      path: string[];
      depth: number;
      invalidationReason: string;
    }> = [];

    for (const d of discoveredNodeIds) {
      const node = nodeById.get(d.id);
      if (!node) continue;

      const pathDescription = [...d.path, node.label];
      const reason = `Directly dependent on modified ${sourceNode.nodeType} "${sourceNode.label}" via ${d.path.join(" -> ")}`;

      dependencyChains.push({
        targetNode: node,
        path: pathDescription,
        depth: d.depth,
        invalidationReason: reason,
      });

      if (
        node.nodeType === "extracted_entity" ||
        node.nodeType === "medication_record" ||
        node.nodeType === "documented_allergy" ||
        node.nodeType === "lab_observation"
      ) {
        affectedEntities.push(node);
      } else if (node.nodeType === "clinical_finding") {
        affectedFindings.push(node);
      } else if (node.nodeType === "clinical_review") {
        affectedReviews.push(node);
      } else if (node.nodeType === "discharge_draft") {
        affectedDischargeDrafts.push(node);
      }
    }

    return {
      sourceNodeId,
      sourceNodeType: sourceNode.nodeType,
      sourceLabel: sourceNode.label,
      affectedEntities,
      affectedFindings,
      affectedReviews,
      affectedDischargeDrafts,
      dependencyChains,
      totalAffectedCount: dependencyChains.length,
      requiresReassessmentCount: affectedFindings.length,
    };
  }
}
