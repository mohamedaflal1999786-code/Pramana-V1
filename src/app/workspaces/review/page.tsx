"use client";

import * as React from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CheckSquare, ShieldCheck, CheckCircle2, XCircle, HelpCircle, Sparkles } from "lucide-react";
import { getPatientSafetyAlertsAction, reviewClinicalFindingAction } from "@/lib/actions/ai-actions";
import type { SafetyFinding } from "@/lib/ai/types";

export default function ProfessionalReviewPage() {
  const [alerts, setAlerts] = React.useState<SafetyFinding[]>([]);
  const [selectedAlertId, setSelectedAlertId] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<"endorsed" | "rejected" | "clarification_requested" | null>(null);
  const [rationale, setRationale] = React.useState("");
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const loadAlerts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPatientSafetyAlertsAction();
      setAlerts(data);
    } catch (err: any) {
      console.error("Failed to load review items:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleOpenAction = (
    alertId: string,
    action: "endorsed" | "rejected" | "clarification_requested"
  ) => {
    setSelectedAlertId(alertId);
    setPendingAction(action);
    setRationale(action === "endorsed" ? "Confirmed valid clinical finding." : "");
    setIsConfirmOpen(true);
  };

  const handleConfirmDecision = async () => {
    if (!selectedAlertId || !pendingAction) return;

    try {
      const res = await reviewClinicalFindingAction(selectedAlertId, pendingAction, rationale);
      setStatusMessage(res.message);
      setIsConfirmOpen(false);
      setTimeout(() => setStatusMessage(null), 3000);
      loadAlerts();
    } catch (err: any) {
      alert(`Attestation error: ${err.message}`);
    }
  };

  return (
    <WorkspaceLayout pageTitle="Professional Review Queue">
      <PageHeader
        eyebrow="Human-in-the-Loop Governance"
        title="Professional Review & Attestation"
        description="Licensed healthcare professionals examine extracted discrepancies, review source document excerpts, and endorse or reject alerts with auditable rationale."
        actions={
          <Button variant="outline" size="sm" onClick={loadAlerts} isLoading={isLoading}>
            Refresh Queue
          </Button>
        }
      />

      {statusMessage && (
        <div className="p-3 bg-[#e5f1df] text-[#145a45] border border-[#c1e1b4] rounded-[8px] text-[13px] flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Attestation Review Queue */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6 mb-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">Pending Attestation Items</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Each decision is recorded in the institutional compliance audit log with reviewer identity and timestamp.
            </p>
          </div>
          <Badge variant={alerts.length > 0 ? "unverified" : "verified"}>
            {alerts.length > 0 ? `${alerts.length} Pending Review` : "Queue Clear"}
          </Badge>
        </div>

        {alerts.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="w-8 h-8" />}
            title="All Flagged Items Have Been Reviewed"
            description="There are currently zero clinical findings pending review in this institutional ward. The attestation queue is clear."
          />
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-5 rounded-[8px] border border-[var(--line)] bg-[#faf9f5] hover:border-[var(--green)] transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.severity === "critical" ? "danger" : "default"}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <h4 className="text-[15px] font-[650] text-[var(--ink)] my-0">{alert.title}</h4>
                    </div>
                    <p className="text-[13px] text-[var(--ink)] my-0 leading-relaxed">{alert.summary}</p>
                  </div>
                  <Badge variant={alert.reviewStatus === "endorsed" ? "verified" : alert.reviewStatus === "rejected" ? "danger" : "unverified"}>
                    {alert.reviewStatus.toUpperCase()}
                  </Badge>
                </div>

                {alert.clinicalRationale && (
                  <div className="p-3 bg-white rounded-[6px] border border-[var(--line)] text-[12px] text-[var(--muted)] leading-relaxed">
                    <strong className="text-[var(--ink)]">Clinical Rationale: </strong>
                    {alert.clinicalRationale}
                    <div className="mt-1 text-[11px] text-[var(--muted)] font-mono">
                      Rule Ref: {alert.referenceSource}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)] font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--green)]" />
                    <span>Evidence-Linked Node</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenAction(alert.id, "clarification_requested")}
                      leftIcon={<HelpCircle className="w-3.5 h-3.5 text-[#8c591c]" />}
                    >
                      Request Clarification
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenAction(alert.id, "rejected")}
                      leftIcon={<XCircle className="w-3.5 h-3.5 text-[#b91c1c]" />}
                    >
                      Reject / Dismiss
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenAction(alert.id, "endorsed")}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    >
                      Endorse Finding
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
        onConfirm={handleConfirmDecision}
        title={`Confirm Clinical ${pendingAction ? pendingAction.toUpperCase() : "Attestation"}`}
        message="Are you sure you want to commit this clinical decision? Your decision, reviewer ID, and clinical rationale will be logged in the immutable compliance audit trail."
        confirmLabel={`Submit ${pendingAction ? pendingAction.toUpperCase() : "Decision"}`}
      />
    </WorkspaceLayout>
  );
}
