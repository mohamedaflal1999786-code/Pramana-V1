"use client";

import * as React from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowRightLeft, CheckCircle2, AlertTriangle, Clock, Sparkles } from "lucide-react";
import { runHandoffAiAnalysisAction } from "@/lib/actions/ai-actions";
import type { HandoffOmissionItem } from "@/lib/ai/types";

export default function ClinicalHandoffsPage() {
  const [handoffText, setHandoffText] = React.useState("");
  const [chartText, setChartText] = React.useState(
    `PRIMARY CHART: Patient Jane Doe, 68F. Encounter #ENC-2026-9901.
DIAGNOSES: Acute Coronary Syndrome, Type 2 Diabetes Mellitus.
ALLERGIES: Severe Penicillin allergy (anaphylaxis documented in 2024).
ACTIVE MEDICATIONS:
- Warfarin 2.5mg PO daily (Target INR 2.0-3.0)
- Lisinopril 10mg PO daily
- Metformin 500mg PO BID
PENDING LABS & CULTURES:
- Blood cultures x2 drawn 14:00 (Awaiting 48h final read)
- Serum Creatinine check scheduled for 06:00 tomorrow
CODE STATUS: Full Code. Responsible Attending: Dr. Sarah Vance.`
  );
  const [omissions, setOmissions] = React.useState<HandoffOmissionItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [checkedIds, setCheckedIds] = React.useState<Record<string, boolean>>({});

  const handleRunVerification = async () => {
    if (!handoffText.trim()) return;
    setIsLoading(true);
    try {
      const res = await runHandoffAiAnalysisAction(
        "ENC-2026-9901",
        handoffText,
        chartText
      );
      setOmissions(res.omissions);
    } catch (err: any) {
      alert(`Handoff Analysis Failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleHandoff = () => {
    setHandoffText(
      `SBAR TRANSITION SUMMARY:
Patient Jane Doe stepping down from ICU to Telemetry Ward.
Condition is stable post-ACS catheterization.
Continuing cardiac telemetry.
Medications communicated: Lisinopril and Metformin given today.
Patient resting comfortably, vital signs within normal limits.`
    );
  };

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <WorkspaceLayout pageTitle="Clinical Handoffs">
      <PageHeader
        eyebrow="Care Continuity & Shift Auditing"
        title="Clinical Handoff Verification"
        description="Verify that critical patient safety information, pending diagnostic lab tests, and therapy changes are communicated during shift handoffs using Gemini AI evidence grounding."
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={loadSampleHandoff}>
              Load ICU Step-Down Sample
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunVerification}
              isLoading={isLoading}
              disabled={!handoffText.trim()}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-white" />}
            >
              Verify Handoff with Gemini
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left: Input SBAR Note */}
        <section className="bg-white rounded-[12px] border border-[var(--line)] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">
              Shift Handoff Note (SBAR Format)
            </h3>
            <Badge variant="unverified">Draft Input</Badge>
          </div>

          <textarea
            value={handoffText}
            onChange={(e) => setHandoffText(e.target.value)}
            placeholder="Paste or write the outgoing clinician's shift transfer or sign-out summary here..."
            className="w-full h-48 p-3 text-[13px] border border-[var(--line)] rounded-[8px] font-sans focus:outline-none focus:border-[var(--green)] resize-none"
          />

          <div className="pt-2">
            <details className="text-[12px] text-[var(--muted)]">
              <summary className="cursor-pointer font-[650] text-[var(--ink)]">
                Inspect Source Chart Context (Grounding Reference)
              </summary>
              <pre className="mt-2 p-3 bg-[#faf9f5] rounded-[6px] border border-[var(--line)] text-[11px] whitespace-pre-wrap font-mono">
                {chartText}
              </pre>
            </details>
          </div>
        </section>

        {/* Right: AI Handoff Safety Audit Results */}
        <section className="bg-white rounded-[12px] border border-[var(--line)] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">
              Safety Omissions & Checklist
            </h3>
            <Badge variant={omissions.length > 0 ? "danger" : "verified"}>
              {omissions.length > 0 ? `${omissions.length} Omissions Detected` : "Audit Ready"}
            </Badge>
          </div>

          {omissions.length === 0 ? (
            <EmptyState
              icon={<ArrowRightLeft className="w-8 h-8" />}
              title="No Handoff Audit Run Yet"
              description="Click 'Verify Handoff with Gemini' to audit the draft note against the patient's primary medical chart."
            />
          ) : (
            <div className="space-y-3">
              {omissions.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-[8px] border border-[#f5c6c6] bg-[#fdf2f2] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#b91c1c]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#991b1b]">
                        OMITTED: {item.category}
                      </span>
                    </div>
                    <label className="flex items-center gap-1.5 text-[12px] text-[var(--ink)] font-[650] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!checkedIds[item.id]}
                        onChange={() => toggleCheck(item.id)}
                        className="rounded text-[var(--green)]"
                      />
                      <span>Acknowledge</span>
                    </label>
                  </div>

                  <h4 className="text-[14px] font-[650] text-[#991b1b] my-0">{item.item}</h4>

                  <div className="p-2.5 bg-white rounded-[6px] border border-[#f5c6c6] text-[11px] text-[var(--ink)] font-mono">
                    <strong>Source Evidence: </strong>&ldquo;{item.sourceEvidence.rawQuote}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Handoff Standard Standards */}
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
