/**
 * Pramana-V1 - Evidence Replay & Historical Graph Comparison Engine
 * Team: Unknown GenZ
 * Phase: 07 — Safety Provenance Graph
 *
 * Implements historical graph reconstruction and state comparison:
 * - Lists and fetches versioned snapshots
 * - Diffs historical vs current graph state (added, invalidated, status transitions)
 * - Restores complete audit lineage at any arbitrary point in time
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { GraphService } from "./graph-service";
import type { GraphSnapshotRecord, SPGNode, SPGEdge, GraphNodeStatus } from "./types";

export class ReplayEngine {
  /**
   * Lists all historical snapshots recorded for a patient
   */
  public static async listPatientSnapshots(
    patientId: string,
    organizationId: string
  ): Promise<GraphSnapshotRecord[]> {
    const admin = getSupabaseAdminClient();
    if (!admin) return [];

    try {
      const { data, error } = await admin
        .from("graph_snapshots" as any)
        .select("id, patient_id, version_number, trigger_event, trigger_reference_id, node_count, edge_count, sha256_hash, created_at")
        .eq("organization_id", organizationId)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error || !data) return [];

      return data.map((d: any) => ({
        id: d.id,
        patientId: d.patient_id,
        versionNumber: d.version_number,
        triggerEvent: d.trigger_event,
        triggerReferenceId: d.trigger_reference_id,
        nodeCount: d.node_count,
        edgeCount: d.edge_count,
        sha256Hash: d.sha256_hash,
        createdAt: d.created_at,
        snapshotData: { nodes: [], edges: [] },
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetches a specific historical snapshot with complete nodes and edges
   */
  public static async getSnapshotById(
    snapshotId: string,
    organizationId: string
  ): Promise<GraphSnapshotRecord | null> {
    const admin = getSupabaseAdminClient();
    if (!admin) return null;

    try {
      const { data, error } = await admin
        .from("graph_snapshots" as any)
        .select("*")
        .eq("organization_id", organizationId)
        .eq("id", snapshotId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        patientId: data.patient_id,
        versionNumber: data.version_number,
        triggerEvent: data.trigger_event,
        triggerReferenceId: data.trigger_reference_id,
        nodeCount: data.node_count,
        edgeCount: data.edge_count,
        sha256Hash: data.sha256_hash,
        createdAt: data.created_at,
        snapshotData: data.snapshot_data || { nodes: [], edges: [] },
      };
    } catch {
      return null;
    }
  }

  /**
   * Compares a historical snapshot against the current live graph state
   */
  public static async compareGraphStates(
    historicalSnapshotId: string,
    patientId: string,
    organizationId: string
  ): Promise<{
    historicalSnapshot: GraphSnapshotRecord;
    currentGraphSummary: { totalNodes: number; totalEdges: number; activeFindings: number };
    addedNodes: SPGNode[];
    removedNodes: SPGNode[];
    invalidatedFindings: Array<{ node: SPGNode; reason: string }>;
    newFindings: SPGNode[];
    statusTransitions: Array<{ nodeId: string; label: string; oldStatus: string; newStatus: string }>;
  }> {
    const snapshot = await this.getSnapshotById(historicalSnapshotId, organizationId);
    if (!snapshot) {
      throw new Error(`Historical graph snapshot ${historicalSnapshotId} not found.`);
    }

    const currentGraph = await GraphService.getPatientSPG(patientId, organizationId);

    const histNodes = snapshot.snapshotData.nodes || [];
    const currNodes = currentGraph.nodes || [];

    const histNodeMap = new Map(histNodes.map((n) => [n.id, n]));
    const currNodeMap = new Map(currNodes.map((n) => [n.id, n]));

    // Nodes added since snapshot
    const addedNodes = currNodes.filter((n) => !histNodeMap.has(n.id));
    // Nodes removed since snapshot
    const removedNodes = histNodes.filter((n) => !currNodeMap.has(n.id));

    // Status transitions
    const statusTransitions: Array<{ nodeId: string; label: string; oldStatus: string; newStatus: string }> = [];
    const invalidatedFindings: Array<{ node: SPGNode; reason: string }> = [];

    for (const [id, currNode] of Array.from(currNodeMap.entries())) {
      const oldNode = histNodeMap.get(id);
      if (oldNode && oldNode.status !== currNode.status) {
        statusTransitions.push({
          nodeId: id,
          label: currNode.label,
          oldStatus: oldNode.status,
          newStatus: currNode.status,
        });

        if (
          currNode.nodeType === "clinical_finding" &&
          (currNode.status === "stale" || currNode.status === "requires_reassessment" || currNode.status === "superseded")
        ) {
          invalidatedFindings.push({
            node: currNode,
            reason: currNode.metadata.invalidationReason || "Source document superseded in later graph revision",
          });
        }
      }
    }

    // New clinical findings that did not exist in the snapshot
    const newFindings = addedNodes.filter((n) => n.nodeType === "clinical_finding");

    return {
      historicalSnapshot: snapshot,
      currentGraphSummary: {
        totalNodes: currentGraph.nodes.length,
        totalEdges: currentGraph.edges.length,
        activeFindings: currentGraph.metadata.activeFindingsCount,
      },
      addedNodes,
      removedNodes,
      invalidatedFindings,
      newFindings,
      statusTransitions,
    };
  }
}
