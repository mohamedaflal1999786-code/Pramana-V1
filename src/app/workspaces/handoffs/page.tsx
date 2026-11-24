"use client";

import * as React from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ArrowRightLeft, FileText, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

export default function ClinicalHandoffsPage() {
  return (
    <WorkspaceLayout pageTitle="Clinical Handoffs">
      <PageHeader
        eyebrow="Care Continuity Auditing"
        title="Clinical Handoff Verification"
        description="Verify that critical patient safety information, pending diagnostic lab tests, and therapy changes are communicated during shift handoffs and transfers."
      />

      {/* Handoff SBAR Verification Queue */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">Shift Transition & Transfer Verification</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Audit transfer notes against pending diagnostic workups and ICU/Ward step-down orders.
            </p>
          </div>
          <Badge variant="unverified">0 Pending Handoffs</Badge>
        </div>

        <EmptyState
          icon={<ArrowRightLeft className="w-8 h-8" />}
          title="No Active Handoff Summaries Loaded"
          description="Upload an SBAR transfer summary or physician sign-out sheet to audit for incomplete follow-up instructions or omitted chronic therapies."
          action={
            <Button variant="outline" size="sm">
              Ingest Transfer Summary →
            </Button>
          }
        />
      </section>

      {/* Handoff Audit Checklist Standard */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="tile">
          <Clock className="w-6 h-6 text-[var(--green)] mb-3" />
          <h3 className="text-[17px] font-[650] my-0 mb-1">Pending Lab Workups</h3>
          <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
            Identifies blood cultures, pathology biopsies, and cardiac enzymes drawn prior to transfer that lack documented follow-up.
          </p>
        </div>

        <div className="tile">
          <AlertTriangle className="w-6 h-6 text-[#8c591c] mb-3" />
          <h3 className="text-[17px] font-[650] my-0 mb-1">Code Status Concordance</h3>
          <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
            Flags discrepancies between admission resuscitation directives and subsequent shift transfer orders.
          </p>
        </div>

        <div className="tile">
          <CheckCircle2 className="w-6 h-6 text-[var(--green)] mb-3" />
          <h3 className="text-[17px] font-[650] my-0 mb-1">Attending Sign-Out Log</h3>
          <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
            Logs transferring and receiving physician attestations with timestamps for institutional clinical safety accountability.
          </p>
        </div>
      </section>
    </WorkspaceLayout>
  );
}
