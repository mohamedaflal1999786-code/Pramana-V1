"use client";

import * as React from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShieldCheck, CheckCircle2, XCircle, HelpCircle, Sparkles } from "lucide-react";
import {
  getPatientSafetyAlertsAction,
  reviewClinicalFindingAction,
  getAiEngineHealthAction,
} from "@/lib/actions/ai-actions";
import type { SafetyFinding } from "@/lib/ai/types";

export default function SafetyAlertsPage() {
  const [filterSeverity, setFilterSeverity] = React.useState<"all" | "critical" | "high" | "moderate">("all");
  const [alerts, setAlerts] = React.useState<SafetyFinding[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [aiStatus, setAiStatus] = React.useState<{ isOnline: boolean; modelName: string; latencyMs: number } | null>(null);
  const [actionFeedback, setActionFeedback] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedAlerts, health] = await Promise.all([
        getPatientSafetyAlertsAction(),
        getAiEngineHealthAction(),
      ]);
      setAlerts(fetchedAlerts);
      setAiStatus(health);
    } catch (err: any) {
      console.error("Failed to load safety alerts:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReview = async (
    alertId: string,
    decision: "endorsed" | "rejected" | "clarification_requested"
  ) => {
    try {
      const res = await reviewClinicalFindingAction(alertId, decision, `Clinician marked as ${decision}`);
      if (res.success) {
        setActionFeedback(res.message);
        setTimeout(() => setActionFeedback(null), 3000);
        loadData();
      }
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === "all") return true;
    return a.severity === filterSeverity;
  });

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;
  const moderateCount = alerts.filter((a) => a.severity === "moderate").length;

  return (
    <WorkspaceLayout pageTitle="Safety Alert Centre">
      <PageHeader
        eyebrow="Triage & Clinical Surveillance"
        title="Safety Alert Centre"
        description="Prioritized clinical alert feed classifying potential patient contraindications, medication discrepancies, and handoff oversights powered by Gemini AI and deterministic safety rules."
        actions={
          <div className="flex items-center gap-3">
            {aiStatus && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-[var(--line)] bg-[#faf9f5] text-[12px]">
                <span className={`w-2 h-2 rounded-full ${aiStatus.isOnline ? "bg-[var(--green)]" : "bg-[#b91c1c]"}`} />
                <span className="font-[650] text-[var(--ink)]">AI Engine: {aiStatus.modelName}</span>
                <span className="text-[var(--muted)]">({aiStatus.latencyMs}ms)</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={loadData} isLoading={isLoading}>
              Refresh Feed
            </Button>
          </div>
        }
      />

      {actionFeedback && (
        <div className="p-3 bg-[#e5f1df] text-[#145a45] border border-[#c1e1b4] rounded-[8px] text-[13px] flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Severity Filter Tabs */}
      <div className="flex border-b border-[var(--line)] gap-6 mb-6">
        <button
          onClick={() => setFilterSeverity("all")}
          className={`pb-3 text-[14px] font-[650] border-b-2 transition-colors cursor-pointer ${
            filterSeverity === "all"
              ? "border-[var(--green)] text-[var(--green)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          All Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setFilterSeverity("critical")}
          className={`pb-3 text-[14px] font-[650] border-b-2 transition-colors cursor-pointer ${
            filterSeverity === "critical"
              ? "border-[var(--green)] text-[var(--green)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          Critical Contraindications ({criticalCount})
        </button>
        <button
          onClick={() => setFilterSeverity("high")}
          className={`pb-3 text-[14px] font-[650] border-b-2 transition-colors cursor-pointer ${
            filterSeverity === "high"
              ? "border-[var(--green)] text-[var(--green)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          High Risk ({highCount})
        </button>
        <button
          onClick={() => setFilterSeverity("moderate")}
          className={`pb-3 text-[14px] font-[650] border-b-2 transition-colors cursor-pointer ${
            filterSeverity === "moderate"
              ? "border-[var(--green)] text-[var(--green)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          Moderate ({moderateCount})
        </button>
      </div>

      {/* Alert Feed Container */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6 mb-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">Active Surveillance Feed</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Showing {filteredAlerts.length} findings • Filter: {filterSeverity.toUpperCase()}
            </p>
          </div>
          <Badge variant={alerts.length > 0 ? "danger" : "verified"}>
            {alerts.length > 0 ? `${alerts.length} Potential Issues` : "Surveillance Active"}
          </Badge>
        </div>

        {filteredAlerts.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-8 h-8" />}
            title="Zero Safety Alerts Detected"
            description="The active surveillance queue is clear. No unverified contraindications or handoff discrepancies are flagged in the current session."
          />
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-5 rounded-[8px] border border-[var(--line)] bg-[#faf9f5] hover:border-[var(--green)] transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.severity === "critical" ? "danger" : alert.severity === "high" ? "discrepancy" : "default"}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <h4 className="text-[15px] font-[650] text-[var(--ink)] my-0">{alert.title}</h4>
                    </div>
                    <p className="text-[13px] text-[var(--ink)] my-0 leading-relaxed font-[450]">{alert.summary}</p>
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
                      Ref: {alert.referenceSource}
                    </div>
                  </div>
                )}

                {/* Human in the loop review controls */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)] font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--green)]" />
                    <span>Evidence-Grounded Finding</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReview(alert.id, "clarification_requested")}
                      leftIcon={<HelpCircle className="w-3.5 h-3.5 text-[#8c591c]" />}
                    >
                      Request Clarification
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReview(alert.id, "rejected")}
                      leftIcon={<XCircle className="w-3.5 h-3.5 text-[#b91c1c]" />}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleReview(alert.id, "endorsed")}
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

      {/* Alert Classification Guide */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="tile">
          <Badge variant="danger" dot className="mb-3">Critical</Badge>
          <h3 className="text-[17px] font-[650] my-0 mb-1">Severe Contraindication</h3>
          <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
            Direct allergy conflicts or lethal drug interactions requiring immediate attending physician intervention before medication administration.
          </p>
        </div>

        <div className="tile">
          <Badge variant="discrepancy" dot className="mb-3">Moderate</Badge>
          <h3 className="text-[17px] font-[650] my-0 mb-1">Transfer Discrepancy</h3>
          <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
            Dose variations, missing transition medications, or unverified secondary lab results during ward or ICU step-down handoffs.
          </p>
        </div>

        <div className="tile">
          <Badge variant="pending" dot className="mb-3">Advisory</Badge>
          <h3 className="text-[17px] font-[650] my-0 mb-1">Documentation Gaps</h3>
          <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
            Low-confidence text extractions, missing clinician signature timestamps, or incomplete discharge instruction fields.
          </p>
        </div>
      </section>
    </WorkspaceLayout>
  );
}
