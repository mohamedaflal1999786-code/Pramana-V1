"use client";

import * as React from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Pill, AlertOctagon, CheckCircle2, ShieldCheck, UploadCloud, RefreshCw } from "lucide-react";

export default function MedicationSafetyPage() {
  return (
    <WorkspaceLayout pageTitle="Medication Safety">
      <PageHeader
        eyebrow="Pharmacovigilance & Reconciliation"
        title="Medication Discrepancy Verification"
        description="Cross-check active physician orders against pre-admission regimens, allergy contraindications, and transfer handoffs."
        actions={
          <div className="flex gap-2">
            <Button variant="primary" size="sm" leftIcon={<UploadCloud className="w-4 h-4" />}>
              Ingest Order Sheet
            </Button>
          </div>
        }
      />

      {/* Medication Audit Schema Table */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">Reconciliation Matrix</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Audit for omissions, duplicates, and dose variances across care shifts.
            </p>
          </div>
          <Badge variant="unverified">0 Discrepancies</Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medication Name</TableHead>
              <TableHead>Route & Dose</TableHead>
              <TableHead>Source File</TableHead>
              <TableHead>Allergy Status</TableHead>
              <TableHead>Audit Finding</TableHead>
              <TableHead>Verification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <EmptyState
                  icon={<Pill className="w-7 h-7" />}
                  title="No Medications in Active Reconciliation Queue"
                  description="Upload a Medication Administration Record (MAR) or discharge order sheet to evaluate drug-allergy interactions and transfer therapy gaps."
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* Audit Rules Scope */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="tile">
          <span className="num">ALGORITHM SPECIFICATION</span>
          <h3 className="text-[17px] font-[650] my-2">Therapeutic Class Conflict Rules</h3>
          <p className="text-[13px] text-[var(--muted)] leading-relaxed my-0">
            Identifies overlapping therapeutic agents (e.g. concurrent ACE-inhibitor and ARB administration) and alerts reviewing clinicians with direct citations from source orders.
          </p>
        </div>

        <div className="tile">
          <span className="num">SAFETY BOUNDARY</span>
          <h3 className="text-[17px] font-[650] my-2">Human Attestation Mandatory</h3>
          <p className="text-[13px] text-[var(--muted)] leading-relaxed my-0">
            Pramana-V1 flags potential conflicts for clinical decision-making. No prescription order is canceled or modified automatically by the software.
          </p>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
