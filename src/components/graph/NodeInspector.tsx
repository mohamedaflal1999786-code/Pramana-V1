"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  GitBranch,
  AlertTriangle,
  ExternalLink,
  Hash,
  Clock,
  Sparkles,
} from "lucide-react";
import type { SPGNode } from "@/lib/graph/types";

interface NodeInspectorProps {
  node: SPGNode | null;
  onTraceLineage?: (nodeId: string) => void;
  onTraceImpact?: (nodeId: string) => void;
  onReview?: (nodeId: string, decision: "endorsed" | "rejected" | "clarification_requested") => Promise<void>;
  isLoadingReview?: boolean;
}

export function NodeInspector({
  node,
  onTraceLineage,
  onTraceImpact,
  onReview,
  isLoadingReview,
}: NodeInspectorProps) {
  if (!node) {
    return (
      <div className="bg-white p-6 rounded-[12px] border border-[var(--line)] text-center text-[var(--muted)]">
        <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-40 text-[var(--ink)]" />
        <h4 className="text-[14px] font-[650] text-[var(--ink)] mb-1">Select an Evidence Node</h4>
        <p className="text-[12px]">Click any node on the provenance graph to inspect its source quotation, rule logic, and cryptographic lineage.</p>
      </div>
    );
  }

  const isFinding = node.nodeType === "clinical_finding";
  const isRule = node.nodeType === "reference_rule";
  const isEntity = node.nodeType === "extracted_entity" || node.nodeType === "medication_record" || node.nodeType === "documented_allergy";
  const isSpan = node.nodeType === "evidence_span";
  const isDoc = node.nodeType === "clinical_document" || node.nodeType === "document_version";

  const getStatusBadge = () => {
    switch (node.status as string) {
      case "verified":
        return <Badge variant="verified">Cryptographically Verified</Badge>;
      case "stale":
      case "requires_reassessment":
        return <Badge variant="danger">Requires Reassessment</Badge>;
      case "invalidated":
      case "superseded":
        return <Badge variant="danger">Invalidated / Superseded</Badge>;
      case "pending_review":
        return <Badge variant="pending">Pending Clinical Attestation</Badge>;
      case "endorsed":
        return <Badge variant="verified">Attested by Clinician</Badge>;
      case "rejected":
        return <Badge variant="discrepancy">Rejected in Review</Badge>;
      default:
        return <Badge variant="default">{node.status}</Badge>;
    }
  };

  return (
    <div className="bg-white p-5 rounded-[12px] border border-[var(--line)] space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[var(--line)]">
        <div>
          <span className="text-[10px] font-[700] tracking-wider uppercase text-[var(--muted)]">
            {node.nodeType.replace(/_/g, " ")}
          </span>
          <h3 className="text-[16px] font-[700] text-[var(--ink)] leading-snug mt-0.5">
            {node.label}
          </h3>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Verbatim Evidence Quote */}
      {(node.metadata?.quote || node.metadata?.verbatimQuote) && (
        <div className="p-3 bg-[#faf9f5] border border-[#dcd7cb] rounded-[8px] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-[650] text-[#145a45]">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Verbatim Source Evidence
            </span>
            {node.metadata?.charStart !== undefined && (
              <span className="text-[10px] text-[var(--muted)] font-mono">
                Offsets: [{node.metadata.charStart} : {node.metadata.charEnd}]
              </span>
            )}
          </div>
          <blockquote className="text-[12px] text-[var(--ink)] font-mono italic pl-2 border-l-2 border-[#145a45] my-0 leading-relaxed">
            &ldquo;{node.metadata.quote || node.metadata.verbatimQuote}&rdquo;
          </blockquote>
          {node.metadata?.pageNumber && (
            <p className="text-[10px] text-[var(--muted)] my-0 text-right">
              Page {node.metadata.pageNumber}
            </p>
          )}
        </div>
      )}

      {/* Rule Details */}
      {(isRule || isFinding) && node.metadata?.ruleId && (
        <div className="p-3 bg-[#f5fbf7] border border-[#c3d8c8] rounded-[8px] space-y-1 text-[12px]">
          <div className="flex items-center gap-1.5 font-[650] text-[#145a45]">
            <ShieldCheck className="w-4 h-4" />
            <span>Rule: {node.metadata.ruleId}</span>
          </div>
          {node.metadata?.rationale && (
            <p className="text-[12px] text-[#2c4033] leading-relaxed my-0">
              {node.metadata.rationale}
            </p>
          )}
          {node.metadata?.clinicalGuideline && (
            <p className="text-[10px] text-[var(--muted)] my-0 pt-1 border-t border-[#d5e7db]">
              Guideline: {node.metadata.clinicalGuideline}
            </p>
          )}
        </div>
      )}

      {/* Invalidation Reason if Stale */}
      {(node.status === "stale" || node.status === "requires_reassessment") && (
        <div className="p-3 bg-[#fdf2f2] border border-[#f5c6c6] rounded-[8px] space-y-1 text-[12px] text-[#991b1b]">
          <div className="flex items-center gap-1.5 font-[650]">
            <AlertTriangle className="w-4 h-4" />
            <span>Dependency Invalidated</span>
          </div>
          <p className="text-[11px] leading-relaxed my-0">
            {node.metadata?.invalidationReason || "Upstream clinical document was superseded or corrected. Finding requires clinical re-evaluation."}
          </p>
        </div>
      )}

      {/* Node Properties */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 bg-[#faf9f5] rounded-[6px] border border-[var(--line)]">
          <span className="text-[var(--muted)] block text-[10px]">Node ID:</span>
          <span className="font-mono text-[var(--ink)] truncate block" title={node.id}>
            {node.id.slice(0, 13)}...
          </span>
        </div>
        <div className="p-2 bg-[#faf9f5] rounded-[6px] border border-[var(--line)]">
          <span className="text-[var(--muted)] block text-[10px]">Patient Scope:</span>
          <span className="font-mono text-[var(--ink)] truncate block">
            {node.patientId ? node.patientId.slice(0, 8) : "Institutional"}
          </span>
        </div>
        {node.metadata?.sha256Hash && (
          <div className="col-span-2 p-2 bg-[#faf9f5] rounded-[6px] border border-[var(--line)] flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
            <span className="font-mono text-[10px] text-[var(--ink)] truncate">
              SHA-256: {node.metadata.sha256Hash}
            </span>
          </div>
        )}
      </div>

      {/* Provenance Actions */}
      <div className="space-y-2 pt-2 border-t border-[var(--line)]">
        <div className="flex gap-2">
          {onTraceLineage && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-[11px]"
              leftIcon={<GitBranch className="w-3.5 h-3.5" />}
              onClick={() => onTraceLineage(node.id)}
            >
              Trace Lineage
            </Button>
          )}
          {onTraceImpact && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-[11px]"
              leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => onTraceImpact(node.id)}
            >
              Impact Analysis
            </Button>
          )}
        </div>

        {/* Attestation Controls for Clinical Findings */}
        {isFinding && onReview && (
          <div className="pt-2 border-t border-[var(--line)] space-y-1.5">
            <span className="text-[11px] font-[650] text-[var(--ink)] block">
              Professional Attestation:
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="primary"
                size="sm"
                className="flex-1 text-[11px] bg-[#145a45] hover:bg-[#0e4333]"
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={() => onReview(node.id, "endorsed")}
                isLoading={isLoadingReview}
              >
                Endorse
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-[11px] text-[#b91c1c] hover:bg-[#fdf2f2]"
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
                onClick={() => onReview(node.id, "rejected")}
                isLoading={isLoadingReview}
              >
                Reject
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px]"
                leftIcon={<HelpCircle className="w-3.5 h-3.5" />}
                onClick={() => onReview(node.id, "clarification_requested")}
                isLoading={isLoadingReview}
              >
                Clarify
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

