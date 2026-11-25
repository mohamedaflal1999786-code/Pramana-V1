"use client";

import * as React from "react";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";
import type { SPGNode, SPGEdge, GraphNodeType } from "@/lib/graph/types";

interface InteractiveGraphCanvasProps {
  nodes: SPGNode[];
  edges: SPGEdge[];
  selectedNodeId?: string;
  onSelectNode: (node: SPGNode) => void;
  highlightedNodeIds?: Set<string>;
  highlightedEdgeIds?: Set<string>;
  mode: "live" | "lineage" | "impact" | "replay" | "simulation";
}

interface NodePosition {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
}

export function InteractiveGraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  highlightedNodeIds,
  highlightedEdgeIds,
  mode,
}: InteractiveGraphCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState(1.0);
  const [pan, setPan] = React.useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  // Compute layered positions based on clinical provenance hierarchy
  // Layer 0: Documents & Versions
  // Layer 1: Evidence Spans
  // Layer 2: Extracted Entities (Medications, Allergies, Labs)
  // Layer 3: Reference Rules & Missing Evidence
  // Layer 4: Clinical Findings (Safety Alerts)
  // Layer 5: Clinical Reviews & Attestations
  const positions = React.useMemo(() => {
    const layerMap: Record<GraphNodeType, number> = {
      clinical_document: 0,
      document_version: 0,
      evidence_span: 1,
      extracted_entity: 2,
      medication_record: 2,
      documented_allergy: 2,
      lab_observation: 2,
      reference_rule: 3,
      missing_evidence: 3,
      clinical_finding: 4,
      clinical_review: 5,
      discharge_draft: 5,
      analysis_run: 1,
    };

    const columns: Record<number, SPGNode[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] };
    for (const node of nodes) {
      const col = layerMap[node.nodeType] ?? 2;
      columns[col].push(node);
    }

    const posMap = new Map<string, NodePosition>();
    const colSpacing = 220;
    const rowSpacing = 95;

    for (let col = 0; col <= 5; col++) {
      const colNodes = columns[col] || [];
      const totalHeight = colNodes.length * rowSpacing;
      const startY = Math.max(60, 260 - totalHeight / 2);

      colNodes.forEach((node, idx) => {
        posMap.set(node.id, {
          x: 80 + col * colSpacing,
          y: startY + idx * rowSpacing,
        });
      });
    }

    return posMap;
  }, [nodes]);

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const zoomIn = () => setZoom((z) => Math.min(2.2, z + 0.15));
  const zoomOut = () => setZoom((z) => Math.max(0.4, z - 0.15));
  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 40, y: 40 });
  };
  const fitView = () => {
    setZoom(0.85);
    setPan({ x: 20, y: 30 });
  };

  const getNodeColor = (node: SPGNode) => {
    if (node.status === "stale" || node.status === "superseded" || node.status === "invalidated") {
      return { fill: "#f3f4f6", stroke: "#9ca3af", text: "#4b5563" }; // Neutral Grey
    }
    if (node.nodeType === "clinical_finding") {
      const isCritical = node.metadata.severity === "critical";
      return isCritical
        ? { fill: "#fdf2f2", stroke: "#b91c1c", text: "#991b1b" } // Muted Red
        : { fill: "#faeee8", stroke: "#9c3e21", text: "#7c2d12" };
    }
    if (node.nodeType === "evidence_span" || node.nodeType === "clinical_review") {
      return { fill: "#e5f1df", stroke: "#145a45", text: "#145a45" }; // Forest Green
    }
    if (node.nodeType === "missing_evidence") {
      return { fill: "#fbf4e8", stroke: "#8c591c", text: "#8c591c" }; // Muted Amber
    }
    // Clinical entities & documents: Charcoal
    return { fill: "#f8faf9", stroke: "#4b5563", text: "#172b25" };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[580px] bg-[#faf9f5] border border-[var(--line)] rounded-[12px] overflow-hidden select-none cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Floating Canvas Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-sm border border-[var(--line)] rounded-[8px] shadow-sm">
        <button
          onClick={zoomIn}
          title="Zoom In (+)"
          className="p-1.5 text-[var(--ink)] hover:bg-[#eef2ec] rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          title="Zoom Out (-)"
          className="p-1.5 text-[var(--ink)] hover:bg-[#eef2ec] rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          title="Reset Zoom"
          className="p-1.5 text-[var(--ink)] hover:bg-[#eef2ec] rounded transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={fitView}
          title="Fit View"
          className="p-1.5 text-[var(--ink)] hover:bg-[#eef2ec] rounded transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Guidance Header */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] pointer-events-none opacity-80">
        <span>01 Documents</span>
        <span>02 Evidence Spans</span>
        <span>03 Entities</span>
        <span>04 Safety Rules</span>
        <span>05 Findings</span>
        <span>06 Attestations</span>
      </div>

      {/* SVG Canvas */}
      <svg
        className="w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
        }}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#739680" />
          </marker>
          <marker id="arrow-highlight" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#145a45" />
          </marker>
          <marker id="arrow-conflict" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#b91c1c" />
          </marker>
        </defs>

        {/* 1. Render Graph Edges */}
        {edges.map((edge) => {
          const sourcePos = positions.get(edge.sourceNodeId);
          const targetPos = positions.get(edge.targetNodeId);
          if (!sourcePos || !targetPos) return null;

          const isHighlighted = highlightedEdgeIds?.has(edge.id) || (highlightedNodeIds?.has(edge.sourceNodeId) && highlightedNodeIds?.has(edge.targetNodeId));
          const isConflict = edge.relationshipType === "CONTRADICTS" || edge.relationshipType === "INVALIDATES";
          const isDimmed = (mode === "lineage" || mode === "impact") && !isHighlighted;

          // Bezier curve connecting source to target
          const midX = (sourcePos.x + targetPos.x) / 2;
          const pathD = `M ${sourcePos.x} ${sourcePos.y} C ${midX} ${sourcePos.y}, ${midX} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`;

          return (
            <g key={edge.id} opacity={isDimmed ? 0.15 : 1} className="transition-opacity duration-200">
              <path
                d={pathD}
                fill="none"
                stroke={isConflict ? "#b91c1c" : isHighlighted ? "#145a45" : "#9bb4a0"}
                strokeWidth={isHighlighted ? 3 : 1.75}
                strokeDasharray={isConflict ? "5 3" : edge.relationshipType === "SUPERSEDES" ? "6 4" : undefined}
                markerEnd={isConflict ? "url(#arrow-conflict)" : isHighlighted ? "url(#arrow-highlight)" : "url(#arrow)"}
              />
              {/* Relationship label */}
              <text
                x={midX}
                y={(sourcePos.y + targetPos.y) / 2 - 4}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={isConflict ? "#b91c1c" : isHighlighted ? "#145a45" : "#6b7280"}
                className="bg-white/80 px-1 font-mono pointer-events-none"
              >
                {edge.relationshipType}
              </text>
            </g>
          );
        })}

        {/* 2. Render Graph Nodes */}
        {nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;

          const isSelected = selectedNodeId === node.id;
          const isHighlighted = highlightedNodeIds?.has(node.id);
          const isDimmed = (mode === "lineage" || mode === "impact") && !isHighlighted && !isSelected;
          const colors = getNodeColor(node);

          return (
            <g
              key={node.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node);
              }}
              opacity={isDimmed ? 0.25 : 1}
              className="cursor-pointer transition-all duration-200"
            >
              {/* Outer Selection Aura */}
              {isSelected && (
                <circle
                  cx="0"
                  cy="0"
                  r="32"
                  fill="none"
                  stroke="#145a45"
                  strokeWidth="3"
                  strokeDasharray="4 2"
                  className="animate-spin-slow"
                />
              )}

              {/* Node Body */}
              <circle
                cx="0"
                cy="0"
                r="24"
                fill={colors.fill}
                stroke={isSelected ? "#145a45" : colors.stroke}
                strokeWidth={isSelected ? 3 : 1.8}
                className="hover:filter hover:brightness-95 transition-all"
              />

              {/* Status Indicator Pip */}
              {node.status === "stale" || node.status === "superseded" ? (
                <circle cx="16" cy="-16" r="5" fill="#6b7280" stroke="#ffffff" strokeWidth="1.5" />
              ) : node.nodeType === "clinical_finding" ? (
                <circle cx="16" cy="-16" r="5" fill="#b91c1c" stroke="#ffffff" strokeWidth="1.5" />
              ) : (
                <circle cx="16" cy="-16" r="5" fill="#145a45" stroke="#ffffff" strokeWidth="1.5" />
              )}

              {/* Icon / Type Abbreviation */}
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fontSize="10"
                fontWeight="800"
                fill={colors.text}
                className="pointer-events-none select-none font-mono"
              >
                {node.nodeType === "clinical_document"
                  ? "DOC"
                  : node.nodeType === "document_version"
                  ? "VER"
                  : node.nodeType === "evidence_span"
                  ? "SPAN"
                  : node.nodeType === "clinical_finding"
                  ? "ALERT"
                  : node.nodeType === "reference_rule"
                  ? "RULE"
                  : node.nodeType === "clinical_review"
                  ? "SIGN"
                  : "MED"}
              </text>

              {/* Node Label Below */}
              <text
                x="0"
                y="36"
                textAnchor="middle"
                fontSize="11"
                fontWeight="650"
                fill="#172b25"
                className="pointer-events-none select-none"
              >
                {node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
