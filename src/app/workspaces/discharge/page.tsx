"use client";

import * as React from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Languages, CheckCircle2, ShieldCheck, HeartHandshake } from "lucide-react";

export default function MultilingualDischargePage() {
  const [targetLang, setTargetLang] = React.useState("es");

  return (
    <WorkspaceLayout pageTitle="Multilingual Discharge Assistant">
      <PageHeader
        eyebrow="Patient Health Literacy"
        title="Multilingual Discharge Assistant"
        description="Convert complex physician discharge orders into accessible, plain-language patient instructions across multiple languages with strict clinician attestation."
        actions={
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-[650] text-[var(--muted)]">Target Language:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="text-[13px] border border-[var(--line)] rounded-[6px] py-1.5 px-3 bg-white font-[650] text-[var(--ink)]"
            >
              <option value="es">Español (Spanish)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="zh">中文 (Mandarin)</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="ta">தமிழ் (Tamil - Planned)</option>
              <option value="fr">Français (French)</option>
            </select>
          </div>
        }
      />

      {/* Side-by-Side Dual Column Translation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left Column: Clinician Orders */}
        <div className="bg-white p-6 rounded-[12px] border border-[var(--line)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">
              Source Clinician Discharge Orders
            </h3>
            <Badge variant="default">Medical Terminology</Badge>
          </div>
          <EmptyState
            icon={<Languages className="w-8 h-8" />}
            title="No Discharge Orders Staged"
            description="Ingest physician discharge notes or type clinical instructions to generate patient-accessible translations."
          />
        </div>

        {/* Right Column: Plain Language Translation */}
        <div className="bg-white p-6 rounded-[12px] border border-[var(--line)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">
              Plain-Language Patient Guidance
            </h3>
            <Badge variant="unverified">Awaiting Clinical Source</Badge>
          </div>
          <EmptyState
            icon={<HeartHandshake className="w-8 h-8" />}
            title="Translation Output Standby"
            description="Plain-language patient guidance will appear here with reading grade-level scores and critical warning sign callouts."
          />
        </div>
      </div>

      {/* Health Literacy Safeguards */}
      <section className="tile">
        <span className="num">SAFETY SAFEGUARD</span>
        <h3 className="text-[18px] font-[650] my-2">Clinician Attestation Required Before Patient Delivery</h3>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed my-0">
          Machine translations of medical guidance are strictly provisional. Hospital staff or a licensed clinical provider must examine and verify the translated guidance prior to delivering paperwork to the patient.
        </p>
      </section>
    </WorkspaceLayout>
  );
}
