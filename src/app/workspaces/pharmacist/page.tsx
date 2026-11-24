"use client";

import * as React from "react";
import Link from "next/link";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pill, AlertOctagon, CheckCircle2, ShieldCheck, UploadCloud, RefreshCw } from "lucide-react";

export default function PharmacistWorkspacePage() {
  return (
    <WorkspaceLayout activeRole="pharmacist">
      <PageHeader
        eyebrow="Clinical Pharmacy Console"
        title="Medication Safety & Reconciliation"
        description="Cross-reference prescription orders against allergy histories, identify omitted maintenance therapies, and confirm dosage parameters."
        actions={
          <div className="flex gap-2">
            <Link href="/workspaces/medications">
              <Button variant="primary" size="sm" leftIcon={<Pill className="w-4 h-4" />}>
                Reconciliation Matrix
              </Button>
            </Link>
            <Link href="/workspaces/documents">
              <Button variant="outline" size="sm" leftIcon={<UploadCloud className="w-4 h-4" />}>
                Upload MAR / Orders
              </Button>
            </Link>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[10px] bg-white border border-[var(--line)]">
          <span className="text-[12px] font-[650] text-[var(--muted)] block mb-1">ACTIVE REGIMENS</span>
          <div className="text-[28px] font-[750] text-[var(--ink)]">0</div>
          <span className="text-[11px] text-[var(--muted)]">Parsed medication entries</span>
        </div>

        <div className="p-5 rounded-[10px] bg-white border border-[var(--line)]">
          <span className="text-[12px] font-[650] text-[var(--muted)] block mb-1">ALLERGY CONFLICTS</span>
          <div className="text-[28px] font-[750] text-[#9c3e21]">0</div>
          <span className="text-[11px] text-[var(--muted)]">Potential contraindications</span>
        </div>

        <div className="p-5 rounded-[10px] bg-white border border-[var(--line)]">
          <span className="text-[12px] font-[650] text-[var(--muted)] block mb-1">OMISSION AUDITS</span>
          <div className="text-[28px] font-[750] text-[#8c591c]">0</div>
          <span className="text-[11px] text-[var(--muted)]">Handoff therapy gaps</span>
        </div>

        <div className="p-5 rounded-[10px] bg-white border border-[var(--line)]">
          <span className="text-[12px] font-[650] text-[var(--muted)] block mb-1">PHARMACIST VERIFIED</span>
          <div className="text-[28px] font-[750] text-[var(--green)]">0</div>
          <span className="text-[11px] text-[var(--muted)]">Regimens attested</span>
        </div>
      </div>

      {/* Medication Verification Table Feed */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0">Medication Reconciliation Queue</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Active orders cross-referenced against prior-to-admission records and allergy flags.
            </p>
          </div>
          <Badge variant="unverified">0 Items in Staging</Badge>
        </div>

        <EmptyState
          icon={<Pill className="w-8 h-8" />}
          title="No Active Prescriptions in Staging"
          description="No active medication records have been uploaded for reconciliation. Ingest a Medication Administration Record (MAR), electronic prescription, or transfer summary to begin automated conflict auditing."
          action={
            <Link href="/workspaces/documents">
              <Button variant="outline" size="sm">
                Ingest Medication Sheet →
              </Button>
            </Link>
          }
        />
      </section>

      {/* Pharmacist Reference Rules Scope */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="tile">
          <span className="num">PHARMACOVIGILANCE</span>
          <h3 className="text-[18px] font-[650] my-2">Conflict Detection Parameters</h3>
          <p className="text-[13px] text-[var(--muted)] leading-relaxed my-0">
            The medication safety engine audits for duplicate therapeutic classes, maximum single and daily dosage thresholds, documented penicillin/beta-lactam cross-reactivity, and renal dosing adjustments.
          </p>
        </div>

        <div className="tile">
          <span className="num">ATTRIBUTION</span>
          <h3 className="text-[18px] font-[650] my-2">Evidence Grounding</h3>
          <p className="text-[13px] text-[var(--muted)] leading-relaxed my-0">
            When a dosage or allergy alert is surfaced, the pharmacist can immediately view the exact bounding box in the original prescription note to verify whether handwriting or OCR ambiguity caused a discrepancy.
          </p>
        </div>
      </section>
    </WorkspaceLayout>
  );
}
