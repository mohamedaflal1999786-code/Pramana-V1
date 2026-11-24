"use client";

import * as React from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CheckSquare, ShieldCheck, CheckCircle2, XCircle, FileText } from "lucide-react";

export default function ProfessionalReviewPage() {
  const [selectedAlert, setSelectedAlert] = React.useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  return (
    <WorkspaceLayout pageTitle="Professional Review Queue">
      <PageHeader
        eyebrow="Human-in-the-Loop Governance"
        title="Professional Review & Attestation"
        description="Licensed healthcare professionals examine extracted discrepancies, review source document excerpts, and endorse or reject alerts with auditable rationale."
      />

      {/* Attestation Review Queue */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6 mb-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">Pending Attestation Items</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Each decision is recorded in the institutional compliance log with user identity and timestamp.
            </p>
          </div>
          <Badge variant="verified">Queue Ready</Badge>
        </div>

        <EmptyState
          icon={<CheckSquare className="w-8 h-8" />}
          title="All Flagged Items Have Been Reviewed"
          description="There are currently zero clinical findings pending review in this institutional ward. The attestation queue is clear."
        />
      </section>

      {/* Attestation Policy Standard */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="tile">
          <span className="num">ACCOUNTABILITY</span>
          <h3 className="text-[18px] font-[650] my-2">Three-Way Attestation Actions</h3>
          <ul className="text-[13px] text-[var(--muted)] space-y-2 p-0 m-0 list-none">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--green)]" />
              <span><strong>Endorse Finding:</strong> Confirms the discrepancy is clinically valid and initiates safety action.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#9c3e21]" />
              <span><strong>Reject / Dismiss:</strong> Rejects extraction with required clinical reasoning note.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8c591c]" />
              <span><strong>Request Clarification:</strong> Flags record for attending physician or pharmacy consult.</span>
            </li>
          </ul>
        </div>

        <div className="tile">
          <span className="num">AUDIT LOGGING</span>
          <h3 className="text-[18px] font-[650] my-2">Cryptographic Attestation Stamp</h3>
          <p className="text-[13px] text-[var(--muted)] leading-relaxed my-0">
            Upon confirmation, Pramana-V1 generates an immutable audit record: Reviewer ID, Professional NPI/Role, Action Taken, Justification, and Millisecond Timestamp.
          </p>
        </div>
      </section>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => setIsConfirmOpen(false)}
        title="Confirm Clinical Attestation"
        message="Are you sure you want to endorse this clinical safety finding? Your decision and credentials will be logged in the immutable compliance audit trail."
        confirmLabel="Endorse Finding"
      />
    </WorkspaceLayout>
  );
}
