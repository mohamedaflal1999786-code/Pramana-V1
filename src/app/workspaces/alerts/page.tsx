"use client";

import * as React from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertTriangle, ShieldCheck, CheckCircle2, Filter, AlertCircle } from "lucide-react";

export default function SafetyAlertsPage() {
  const [filterSeverity, setFilterSeverity] = React.useState<"all" | "critical" | "moderate" | "advisory">("all");

  return (
    <WorkspaceLayout pageTitle="Safety Alert Centre">
      <PageHeader
        eyebrow="Triage & Surveillance"
        title="Safety Alert Centre"
        description="Prioritized clinical alert feed classifying potential patient contraindications, medication discrepancies, and handoff oversights."
      />

      {/* Severity Filter Tabs */}
      <div className="flex border-b border-[var(--line)] gap-6">
        <button
          onClick={() => setFilterSeverity("all")}
          className={`pb-3 text-[14px] font-[650] border-b-2 transition-colors cursor-pointer ${
            filterSeverity === "all"
              ? "border-[var(--green)] text-[var(--green)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          All Alerts (0)
        </button>
        <button
          onClick={() => setFilterSeverity("critical")}
          className={`pb-3 text-[14px] font-[650] border-b-2 transition-colors cursor-pointer ${
            filterSeverity === "critical"
              ? "border-[var(--green)] text-[var(--green)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          Critical Contraindications (0)
        </button>
        <button
          onClick={() => setFilterSeverity("moderate")}
          className={`pb-3 text-[14px] font-[650] border-b-2 transition-colors cursor-pointer ${
            filterSeverity === "moderate"
              ? "border-[var(--green)] text-[var(--green)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          Moderate Discrepancies (0)
        </button>
        <button
          onClick={() => setFilterSeverity("advisory")}
          className={`pb-3 text-[14px] font-[650] border-b-2 transition-colors cursor-pointer ${
            filterSeverity === "advisory"
              ? "border-[var(--green)] text-[var(--green)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          Advisory Notes (0)
        </button>
      </div>

      {/* Alert Feed Feed Container */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">Active Surveillance Feed</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Filtered by: {filterSeverity.toUpperCase()}
            </p>
          </div>
          <Badge variant="verified">Surveillance Active</Badge>
        </div>

        <EmptyState
          icon={<ShieldCheck className="w-8 h-8" />}
          title="Zero Safety Alerts Detected"
          description="The active surveillance queue is clear. No unverified contraindications or handoff discrepancies are flagged in the current session."
        />
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
