"use client";

import * as React from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { InteractiveGraphCanvas } from "@/components/graph/InteractiveGraphCanvas";
import { NodeInspector } from "@/components/graph/NodeInspector";
import { CounterfactualSimulationModal } from "@/components/graph/CounterfactualSimulationModal";
import {
  Network,
  GitBranch,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  AlertTriangle,
  Table as TableIcon,
  Eye,
  CheckCircle2,
} from "lucide-react";
import {
  getPatientSafetyProvenanceGraphAction,
  traceEvidenceLineageAction,
  runForwardImpactAnalysisAction,
  reviewGraphFindingAction,
} from "@/lib/actions/graph-actions";
import type { SPGNode, SPGEdge, SafetyProvenanceGraphData } from "@/lib/graph/types";

export default function SafetyProvenanceGraphPage() {
  const [graphData, setGraphData] = React.useState<SafetyProvenanceGraphData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Interaction State
  const [selectedNode, setSelectedNode] = React.useState<SPGNode | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = React.useState<Set<string>>(new Set());
  const [highlightedEdgeIds, setHighlightedEdgeIds] = React.useState<Set<string>>(new Set());
  const [mode, setMode] = React.useState<"live" | "lineage" | "impact" | "replay" | "simulation">("live");
  const [viewMode, setViewMode] = React.useState<"canvas" | "table">("canvas");

  // Filtering
  const [searchQuery, setSearchQuery] = React.useState("");
  const [nodeTypeFilter, setNodeTypeFilter] = React.useState<string>("all");

  // Simulation Modal
  const [isSimModalOpen, setIsSimModalOpen] = React.useState(false);
  const [isAttesting, setIsAttesting] = React.useState(false);

  const fetchGraph = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPatientSafetyProvenanceGraphAction();
      setGraphData(data);
      if (data.nodes.length > 0) {
        // Default select first finding or entity
        const defaultNode =
          data.nodes.find((n) => n.nodeType === "clinical_finding") ||
          data.nodes[0];
        setSelectedNode(previous => data.nodes.find(n => n.id === previous?.id) || defaultNode);
      }
    } catch (err: any) {
      console.error("Failed to load SPG:", err);
      setError(err?.message || "Failed to load Safety Provenance Graph.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Lineage Tracing Handler
  const handleTraceLineage = async (findingNodeId: string) => {
    try {
      const lineage = await traceEvidenceLineageAction(findingNodeId);
      const nodeIds = new Set<string>();
      nodeIds.add(lineage.findingNode.id);
      if (lineage.ruleNode) nodeIds.add(lineage.ruleNode.id);
      lineage.entityNodes.forEach((e) => nodeIds.add(e.id));
      lineage.evidenceSpanNodes.forEach((s) => nodeIds.add(s.id));
      lineage.documentVersionNodes.forEach((d) => nodeIds.add(d.id));

      setHighlightedNodeIds(nodeIds);
      setMode("lineage");
    } catch (err: any) {
      alert(`Lineage Tracing Error: ${err.message}`);
    }
  };

  // Forward Impact Analysis Handler
  const handleTraceImpact = async (sourceNodeId: string) => {
    try {
      const impact = await runForwardImpactAnalysisAction(sourceNodeId);
      const nodeIds = new Set<string>();
      nodeIds.add(sourceNodeId);
      impact.affectedFindings.forEach((f) => nodeIds.add(f.id));
      impact.affectedReviews.forEach((a) => nodeIds.add(a.id));

      setHighlightedNodeIds(nodeIds);
      setMode("impact");
    } catch (err: any) {
      alert(`Impact Analysis Error: ${err.message}`);
    }
  };

  // Attestation Handler
  const handleReviewNode = async (
    nodeId: string,
    decision: "endorsed" | "rejected" | "clarification_requested"
  ) => {
    setIsAttesting(true);
    try {
      const res = await reviewGraphFindingAction(
        nodeId,
        decision,
        `Clinician marked finding as ${decision} via Provenance Console.`
      );
      if (res.success) {
        await fetchGraph();
      }
    } catch (err: any) {
      alert(`Attestation Failed: ${err.message}`);
    } finally {
      setIsAttesting(false);
    }
  };

  // Reset Highlights
  const handleResetMode = () => {
    setMode("live");
    setHighlightedNodeIds(new Set());
    setHighlightedEdgeIds(new Set());
  };

  // Filtered Nodes for Display
  const filteredNodes = React.useMemo(() => {
    if (!graphData) return [];
    return graphData.nodes.filter((node) => {
      const matchesSearch =
        searchQuery === "" ||
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.nodeType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        nodeTypeFilter === "all" || node.nodeType === nodeTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [graphData, searchQuery, nodeTypeFilter]);

  const filteredEdges = React.useMemo(() => {
    if (!graphData) return [];
    const validIds = new Set(filteredNodes.map((n) => n.id));
    return graphData.edges.filter(
      (e) => validIds.has(e.sourceNodeId) && validIds.has(e.targetNodeId)
    );
  }, [graphData, filteredNodes]);

  return (
    <WorkspaceLayout pageTitle="Safety Provenance Graph">
      <PageHeader
        eyebrow="Flagship Technical Innovation"
        title="Safety Provenance Graph (SPG)"
        description="Inspect end-to-end evidence lineage: dynamically trace clinical alerts back to source documents, verify verbatim quotations, run forward impact traversals, and test what-if counterfactual hypotheses."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4 text-[var(--green)]" />}
              onClick={() => setIsSimModalOpen(true)}
            >
              Simulate What-If
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => fetchGraph()}
            >
              Sync Live Graph
            </Button>
          </div>
        }
      />

      {/* Control Ribbon */}
      <div className="bg-white p-4 rounded-[12px] border border-[var(--line)] mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Filter nodes, drugs, rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-[13px] rounded-[6px] border border-[var(--line)] bg-[#faf9f5] focus:outline-none focus:border-[var(--green)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--muted)]" />
            <select
              value={nodeTypeFilter}
              onChange={(e) => setNodeTypeFilter(e.target.value)}
              className="text-[12px] py-1.5 px-2.5 rounded-[6px] border border-[var(--line)] bg-white font-[650] text-[var(--ink)] cursor-pointer"
            >
              <option value="all">All Provenance Layers</option>
              <option value="clinical_document">Source Documents</option>
              <option value="evidence_span">Verbatim Spans</option>
              <option value="extracted_entity">Extracted Entities</option>
              <option value="reference_rule">Deterministic Rules</option>
              <option value="clinical_finding">Safety Alerts</option>
              <option value="clinical_review">Attestations</option>
            </select>
          </div>
        </div>

        {/* View & Mode Toggles */}
        <div className="flex items-center gap-2">
          {mode !== "live" && (
            <Button
              variant="outline"
              size="sm"
              className="text-[11px] text-[#145a45] bg-[#f5fbf7]"
              onClick={handleResetMode}
            >
              Reset to Full Graph
            </Button>
          )}

          <div className="flex rounded-[6px] border border-[var(--line)] overflow-hidden">
            <button
              onClick={() => setViewMode("canvas")}
              className={`px-3 py-1.5 text-[12px] font-[650] flex items-center gap-1.5 ${
                viewMode === "canvas"
                  ? "bg-[#145a45] text-white"
                  : "bg-white text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Interactive DAG
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-[12px] font-[650] flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-[#145a45] text-white"
                  : "bg-white text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Tabular Lineage
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1.1fr] gap-6 items-start">
        {/* Left: Graph Canvas or Tabular Fallback */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white p-12 rounded-[12px] border border-[var(--line)] text-center">
              <RefreshCw className="w-8 h-8 text-[var(--green)] animate-spin mx-auto mb-3" />
              <p className="text-[14px] font-[650] text-[var(--ink)]">Loading Safety Provenance Graph...</p>
              <p className="text-[12px] text-[var(--muted)]">Traversing patient evidence lineages and deterministic rule trees.</p>
            </div>
          ) : error ? (
            <div className="bg-white p-8 rounded-[12px] border border-[#f5c6c6] text-center">
              <AlertTriangle className="w-8 h-8 text-[#b91c1c] mx-auto mb-2" />
              <p className="text-[14px] font-[650] text-[#991b1b]">{error}</p>
              <Button variant="outline" size="sm" onClick={() => fetchGraph()} className="mt-3">
                Retry Connection
              </Button>
            </div>
          ) : viewMode === "canvas" ? (
            <InteractiveGraphCanvas
              nodes={filteredNodes}
              edges={filteredEdges}
              selectedNodeId={selectedNode?.id}
              onSelectNode={(n) => setSelectedNode(n)}
              highlightedNodeIds={highlightedNodeIds}
              highlightedEdgeIds={highlightedEdgeIds}
              mode={mode}
            />
          ) : (
            /* Tabular Fallback View */
            <div className="bg-white rounded-[12px] border border-[var(--line)] overflow-hidden">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#faf9f5] border-b border-[var(--line)] text-[var(--muted)] uppercase font-[700] text-[10px]">
                  <tr>
                    <th className="p-3">Layer / Type</th>
                    <th className="p-3">Label</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Verbatim Evidence / Offsets</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filteredNodes.map((n) => (
                    <tr
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className={`cursor-pointer transition-colors hover:bg-[#faf9f5] ${
                        selectedNode?.id === n.id ? "bg-[#f5fbf7]" : ""
                      }`}
                    >
                      <td className="p-3 font-mono text-[11px] text-[var(--muted)]">
                        {n.nodeType}
                      </td>
                      <td className="p-3 font-[650] text-[var(--ink)]">{n.label}</td>
                      <td className="p-3">
                        <span className="capitalize">{n.status.replace(/_/g, " ")}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[var(--muted)] truncate max-w-xs">
                        {n.metadata?.quote || n.metadata?.verbatimQuote || "—"}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(n);
                          }}
                        >
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Graph Legend */}
          <div className="bg-white p-4 rounded-[12px] border border-[var(--line)] flex flex-wrap items-center justify-between gap-4 text-[11px] text-[var(--muted)]">
            <span className="font-[650] text-[var(--ink)]">DAG Hierarchy (Left to Right):</span>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#e6ede2] border border-[#145a45]" />
                Document / Span
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#fbf4e8] border border-[#8c591c]" />
                Extracted Entity
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#faeee8] border border-[#9c3e21]" />
                Safety Rule
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#fdf2f2] border border-[#b91c1c]" />
                Clinical Alert
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#e5f1df] border border-[#145a45]" />
                Attestation
              </span>
            </div>
          </div>
        </div>

        {/* Right: Node Inspector */}
        <div className="sticky top-6">
          <NodeInspector
            node={selectedNode}
            onTraceLineage={handleTraceLineage}
            onTraceImpact={handleTraceImpact}
            onReview={handleReviewNode}
            isLoadingReview={isAttesting}
          />
        </div>
      </div>

      {/* Counterfactual Simulation Modal */}
      <CounterfactualSimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        patientId={graphData?.nodes[0]?.patientId || "00000000-0000-0000-0000-000000000002"}
      />
    </WorkspaceLayout>
  );
}
