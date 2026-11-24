"use client";

import * as React from "react";
import Link from "next/link";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileUpload } from "@/components/ui/FileUpload";
import { Stethoscope, FileText, AlertTriangle, ShieldCheck, UploadCloud, Network } from "lucide-react";

export default function DoctorWorkspacePage() {
  const [showUpload, setShowUpload] = React.useState(false);

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
          <span className="text-[12px] font-[650] text-[var(--muted)] block mb-1">SESSION RECORDS</span>
          <div className="text-[28px] font-[750] text-[var(--ink)]">0</div>
          <span className="text-[11px] text-[var(--muted)]">Active clinical encounters loaded</span>
        </div>

        <div className="p-5 rounded-[10px] bg-white border border-[var(--line)]">
          <span className="text-[12px] font-[650] text-[var(--muted)] block mb-1">DISCREPANCIES DETECTED</span>
          <div className="text-[28px] font-[750] text-[#8c591c]">0</div>
          <span className="text-[11px] text-[var(--muted)]">Pending physician verification</span>
        </div>

        <div className="p-5 rounded-[10px] bg-white border border-[var(--line)]">
          <span className="text-[12px] font-[650] text-[var(--muted)] block mb-1">VERIFIED ATTESTATIONS</span>
          <div className="text-[28px] font-[750] text-[var(--green)]">0</div>
          <span className="text-[11px] text-[var(--muted)]">Completed in current session</span>
        </div>

        <div className="p-5 rounded-[10px] bg-white border border-[var(--line)]">
          <span className="text-[12px] font-[650] text-[var(--muted)] block mb-1">EXTRACTION CONFIDENCE</span>
          <div className="text-[28px] font-[750] text-[var(--ink)]">—</div>
          <span className="text-[11px] text-[var(--muted)]">Awaiting source document input</span>
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

      {/* Main Encounter Feed & Provenance Review */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0">Active Encounter Review Queue</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Cross-checked alerts requiring physician clinical judgment.
            </p>
          </div>
          <Badge variant="unverified" dot>0 Pending Alerts</Badge>
        </div>

        <EmptyState
          icon={<Stethoscope className="w-8 h-8" />}
          title="No Active Patient Encounters Loaded"
          description="The clinical review queue is currently empty. To analyze a patient transition or cross-check medications, ingest an authorized clinical document using the button above."
          action={
            <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
              Ingest Document to Begin
            </Button>
          }
        />
      </section>

      {/* Clinical Guidance Schema */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="tile">
          <span className="num">SAFETY CHECKS</span>
          <h3 className="text-[18px] font-[650] my-2">Automated Audit Scope</h3>
          <ul className="text-[13px] text-[var(--muted)] space-y-2 p-0 m-0 list-none">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
              <span>Medication dose adjustments across transfer handoffs</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
              <span>Allergy-drug cross-contraindication matching</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
              <span>Critical pending lab test alerts post-discharge</span>
            </li>
          </ul>
        </div>

        <div className="tile">
          <span className="num">HUMAN OVERSIGHT</span>
          <h3 className="text-[18px] font-[650] my-2">Accountable Verification Policy</h3>
          <p className="text-[13px] text-[var(--muted)] leading-relaxed my-0">
            Attending clinicians maintain exclusive authority over medical interventions. Pramana-V1 presents verbatim textual excerpts for professional scrutiny and never executes autonomous care changes.
          </p>
        </div>
      </section>
    </WorkspaceLayout>
  );
}
