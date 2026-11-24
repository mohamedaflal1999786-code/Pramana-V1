"use client";

import * as React from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Network, Info, ShieldCheck, FileText, CheckCircle2, AlertTriangle } from "lucide-react";

interface GraphNode {
  id: string;
  label: string;
  type: "source" | "extraction" | "rule" | "attestation";
  status: "verified" | "pending" | "discrepancy";
  description: string;
  sourceDoc?: string;
  lineReference?: string;
}

const NODES: GraphNode[] = [
  {
    id: "node-1",
    label: "Admission Summary (PDF)",
    type: "source",
    status: "verified",
    description: "Cryptographically hashed source document from inpatient intake.",
    sourceDoc: "admission_summary_01.pdf",
    lineReference: "Section 3, Paragraph 2",
  },
  {
    id: "node-2",
    label: "Penicillin Allergy Extraction",
    type: "extraction",
    status: "discrepancy",
    description: "Extracted allergy flag: Anaphylactic reaction to penicillin documented.",
    sourceDoc: "admission_summary_01.pdf",
    lineReference: "Page 1, Line 24",
  },
  {
    id: "node-3",
    label: "Contraindication Rule #402",
    type: "rule",
    status: "discrepancy",
    description: "Cross-reactivity check: Amoxicillin-clavulanate contraindication flag.",
    sourceDoc: "Institutional Drug Interaction Reference v2.4",
    lineReference: "Beta-lactam sensitivity protocol",
  },
  {
    id: "node-4",
    label: "Attending Physician Attestation",
    type: "attestation",
    status: "pending",
    description: "Awaiting clinical review sign-off by attending physician.",
    sourceDoc: "Attestation Queue #AQ-812",
    lineReference: "Pending Review",
  },
];

export default function SafetyProvenanceGraphPage() {
  const [selectedNode, setSelectedNode] = React.useState<GraphNode>(NODES[1]);

  return (
    <WorkspaceLayout pageTitle="Safety Provenance Graph">
      <PageHeader
        eyebrow="Core Innovation"
        title="Safety Provenance Graph"
        description="Inspect the end-to-end evidence pedigree of clinical alerts: trace from source documents through extracted tokens and reference rules to clinician attestation."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
        {/* Interactive SVG Provenance Graph Visualizer */}
        <div className="bg-white p-6 rounded-[12px] border border-[var(--line)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0 flex items-center gap-2">
              <Network className="w-5 h-5 text-[var(--green)]" />
              <span>Provenance Network Schema</span>
            </h3>
            <span className="text-[11px] text-[var(--muted)]">Click node to inspect metadata</span>
          </div>

          <div className="bg-[#faf9f5] border border-[var(--line)] rounded-[10px] p-6 relative flex flex-col items-center">
            {/* SVG Visual Graph */}
            <svg viewBox="0 0 500 240" className="w-full h-auto max-w-lg">
              {/* Connecting Edges */}
              <line x1="80" y1="120" x2="190" y2="120" stroke="#739680" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="190" y1="120" x2="310" y2="120" stroke="#739680" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="310" y1="120" x2="420" y2="120" stroke="#739680" strokeWidth="2" strokeDasharray="4 4" />

              {/* Node 1: Source Document */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(NODES[0])}
              >
                <circle cx="80" cy="120" r="32" fill="#e6ede2" stroke={selectedNode.id === "node-1" ? "#145a45" : "#9bb4a0"} strokeWidth={selectedNode.id === "node-1" ? "3" : "1.5"} />
                <text x="80" y="116" textAnchor="middle" fontSize="11" fontWeight="700" fill="#172b25">SOURCE</text>
                <text x="80" y="130" textAnchor="middle" fontSize="9" fill="#53665d">Document</text>
              </g>

              {/* Node 2: Extracted Entity */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(NODES[1])}
              >
                <circle cx="190" cy="120" r="34" fill="#faeee8" stroke={selectedNode.id === "node-2" ? "#9c3e21" : "#f0c8ba"} strokeWidth={selectedNode.id === "node-2" ? "3" : "1.5"} />
                <text x="190" y="116" textAnchor="middle" fontSize="11" fontWeight="700" fill="#9c3e21">EXTRACT</text>
                <text x="190" y="130" textAnchor="middle" fontSize="9" fill="#53665d">Allergy Token</text>
              </g>

              {/* Node 3: Safety Rule */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(NODES[2])}
              >
                <circle cx="310" cy="120" r="32" fill="#fbf4e8" stroke={selectedNode.id === "node-3" ? "#8c591c" : "#ebd6b8"} strokeWidth={selectedNode.id === "node-3" ? "3" : "1.5"} />
                <text x="310" y="116" textAnchor="middle" fontSize="11" fontWeight="700" fill="#8c591c">RULE</text>
                <text x="310" y="130" textAnchor="middle" fontSize="9" fill="#53665d">Conflict Check</text>
              </g>

              {/* Node 4: Clinician Attestation */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(NODES[3])}
              >
                <circle cx="420" cy="120" r="32" fill="#f0f3f1" stroke={selectedNode.id === "node-4" ? "#145a45" : "#dce3da"} strokeWidth={selectedNode.id === "node-4" ? "3" : "1.5"} />
                <text x="420" y="116" textAnchor="middle" fontSize="11" fontWeight="700" fill="#172b25">REVIEW</text>
                <text x="420" y="130" textAnchor="middle" fontSize="9" fill="#53665d">Attestation</text>
              </g>
            </svg>

            <div className="flex justify-between w-full text-[11px] font-[650] text-[var(--muted)] pt-3 border-t border-[var(--line)]">
              <span>01 / Document Ingestion</span>
              <span>02 / Entity Grounding</span>
              <span>03 / Clinical Rule Base</span>
              <span>04 / Professional Sign-Off</span>
            </div>
          </div>
        </div>

        {/* Selected Node Provenance Inspector */}
        <div className="bg-white p-6 rounded-[12px] border border-[var(--line)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">Node Provenance Inspector</h3>
            <Badge variant={selectedNode.status === "discrepancy" ? "discrepancy" : selectedNode.status === "verified" ? "verified" : "pending"}>
              {selectedNode.type.toUpperCase()}
            </Badge>
          </div>

          <div>
            <span className="text-[11px] font-[750] text-[var(--muted)] uppercase block mb-1">NODE LABEL</span>
            <p className="text-[16px] font-[650] text-[var(--ink)] my-0">{selectedNode.label}</p>
          </div>

          <div>
            <span className="text-[11px] font-[750] text-[var(--muted)] uppercase block mb-1">PROVENANCE DESCRIPTION</span>
            <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">{selectedNode.description}</p>
          </div>

          <div className="p-3.5 bg-[#faf9f5] rounded-[8px] border border-[var(--line)] space-y-2 text-[12px]">
            <div>
              <strong className="text-[var(--ink)]">Source Document:</strong>{" "}
              <span className="font-mono text-[var(--muted)]">{selectedNode.sourceDoc}</span>
            </div>
            <div>
              <strong className="text-[var(--ink)]">Coordinates / Section:</strong>{" "}
              <span className="text-[var(--muted)]">{selectedNode.lineReference}</span>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" size="sm" className="w-full">
              Inspect Source Document Excerpt →
            </Button>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
