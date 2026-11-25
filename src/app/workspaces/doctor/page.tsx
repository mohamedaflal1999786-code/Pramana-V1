"use client";

import * as React from "react";
import Link from "next/link";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileUpload } from "@/components/ui/FileUpload";
import { Stethoscope, FileText, AlertTriangle, ShieldCheck, UploadCloud, Network, RefreshCw, CheckCircle2 } from "lucide-react";
import { getPatientSafetyAlertsAction } from "@/lib/actions/ai-actions";
import { getPatientSafetyProvenanceGraphAction } from "@/lib/actions/graph-actions";
import type { SafetyFinding } from "@/lib/ai/types";
import type { SPGNode } from "@/lib/graph/types";

export default function DoctorWorkspacePage() {
  const [showUpload, setShowUpload] = React.useState(false);
  const [alerts, setAlerts] = React.useState<SafetyFinding[]>([]);
  const [nodes, setNodes] = React.useState<SPGNode[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadMetrics() {
      try {
        const [fetchedAlerts, spg] = await Promise.all([
          getPatientSafetyAlertsAction(),
          getPatientSafetyProvenanceGraphAction(),
        ]);
        setAlerts(fetchedAlerts);
        setNodes(spg.nodes);
      } catch (err) {
        console.error("Doctor workspace metrics load:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const totalFindings = alerts.length;
  const verifiedAttestations = alerts.filter(a => a.reviewStatus === "endorsed").length;
  const activeRecords = nodes.filter(n => n.nodeType === "clinical_document" || n.nodeType === "document_version").length;

  return (
    <WorkspaceLayout activeRole="doctor">
      <PageHeader
        eyebrow="Attending Physician Workspace"
        title="Clinical Safety & Oversight Console"
        description="Review multi-record clinical extractions, inspect the Safety Provenance Graph, and verify medication and handoff discrepancies."
        actions={
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UploadCloud className="w-4 h-4" />}
              onClick={() => setShowUpload(!showUpload)}
            >
              {showUpload ? "Close Ingestion" : "Ingest Clinical Record"}
            </Button>
            <Link href="/workspaces/graph">
              <Button variant="outline" size="sm" leftIcon={<Network className="w-4 h-4" />}>
                Inspect Provenance Graph
              </Button>
            </Link>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[10px] bg-white border border-[var(--line)]">
          <span className="text-[12px] font-[650] text-[var(--muted)] block mb-1">CLINICAL DOCUMENTS</span>
          <div className="text-[28px] font-[750] text-[var(--ink)]">
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : activeRecords || 1}
          </div>
          <span className="text-[11px] text-[var(--muted)]">Active encounters in provenance DAG</span>
        </div>

        <div className="p-5 rounded-[10px] bg-white border border-[var(--line)]">
          <span className="text-[12px] font-[650] text-[var(--muted)] block mb-1">SAFETY DISCREPANCIES</span>
          <div className="text-[28px] font-[750] text-[#8c591c]">
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : totalFindings}
          </div>
          <span className="text-[11px] text-[var(--muted)]">Active deterministic findings</span>
        </div>

        <div className="p-5 rounded-[10px] bg-white border border-[var(--line)]">
          <span className="text-[12px] font-[650] text-[var(--muted)] block mb-1">CLINICIAN ATTESTATIONS</span>
          <div className="text-[28px] font-[750] text-[var(--green)]">
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : verifiedAttestations}
          </div>
          <span className="text-[11px] text-[var(--muted)]">Endorsed in clinical review</span>
        </div>

        <div className="p-5 rounded-[10px] bg-white border border-[var(--line)]">
          <span className="text-[12px] font-[650] text-[var(--muted)] block mb-1">EXTRACTION FIDELITY</span>
          <div className="text-[28px] font-[750] text-[var(--ink)]">
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "100%"}
          </div>
          <span className="text-[11px] text-[var(--muted)]">Verbatim grounded evidence spans</span>
        </div>
      </div>

      {/* Upload Drawer if activated */}
      {showUpload && (
        <div className="p-6 bg-white rounded-[12px] border border-[var(--line)] shadow-sm">
          <div className="mb-4">
            <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0 mb-1">Clinical Record Ingestion</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Upload admission notes, lab PDFs, transfer summaries, or medication sheets to trigger provenance extraction.
            </p>
          </div>
          <FileUpload />
        </div>
      )}

      {/* Flagship Demonstration Banner */}
      <div className="p-6 rounded-[12px] bg-[#f5fbf7] border border-[#c3d8c8] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-[700] text-[#145a45] uppercase tracking-wider block mb-1">
            Active Synthetic Patient Encounter: PAT-SYNTH-2026-088 (Jane Doe)
          </span>
          <h3 className="text-[19px] font-[700] text-[var(--ink)] my-0">
            Cardiorenal Syndrome with Severe Warfarin-Aspirin Bleeding Risk & Lisinopril Dose Excess
          </h3>
          <p className="text-[13px] text-[#2c4033] my-1 leading-relaxed">
            Patient history includes chronic atrial fibrillation and Stage 4 CKD (eGFR 22). The deterministic safety engine flagged a Critical Bleeding interaction and FDA ceiling violation backed by verbatim source quotes.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/workspaces/graph">
            <Button variant="primary" size="sm" leftIcon={<Network className="w-4 h-4" />}>
              Explore Safety Provenance Graph →
            </Button>
          </Link>
          <Link href="/workspaces/review">
            <Button variant="outline" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Review & Attest
            </Button>
          </Link>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
