"use client";

import * as React from "react";
import Link from "next/link";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { User, Languages, Calendar, AlertCircle, HeartHandshake, FileCheck } from "lucide-react";

export default function PatientWorkspacePage() {
  const [selectedLanguage, setSelectedLanguage] = React.useState("en");

  return (
    <WorkspaceLayout activeRole="patient">
      <PageHeader
        eyebrow="Patient-Centric Guidance"
        title="Discharge Safety & Care Companion"
        description="Understand your recovery instructions, medication schedule, and critical warning signs in accessible, clinician-verified language."
        actions={
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-[var(--green)]" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-[13px] border border-[var(--line)] rounded-[6px] py-1.5 px-3 bg-white font-[650] text-[var(--ink)]"
            >
              <option value="en">English (US)</option>
              <option value="es">Español (Spanish)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="zh">中文 (Mandarin)</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="ta">தமிழ் (Tamil - Planned)</option>
            </select>
          </div>
        }
      />

      {/* Patient Education Overview */}
      <div className="p-6 rounded-[12px] bg-[#e6ede2] border border-[var(--line)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="num">HUMAN VERIFIED</span>
          <h3 className="text-[20px] font-[650] my-1 text-[var(--ink)]">Clinician-Approved Plain Language</h3>
          <p className="text-[14px] text-[var(--muted)] my-0 leading-relaxed">
            All medical explanations on this page are generated from attending physician orders and must be verified by hospital staff prior to your discharge.
          </p>
        </div>
        <Badge variant="verified">Safe Discharge Guard</Badge>
      </div>

      {/* Discharge Instructions Feed */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0">Your Discharge Plan</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Clear instructions regarding what to do, what medications to take, and when to call your care team.
            </p>
          </div>
          <Badge variant="unverified">Awaiting Clinician Attestation</Badge>
        </div>

        <EmptyState
          icon={<HeartHandshake className="w-8 h-8" />}
          title="No Discharge Instructions Active"
          description="Your discharge plan will appear here once your care team completes the clinical safety review and verifies your instructions."
        />
      </section>

      {/* Three Pillars of Patient Care */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="tile">
          <Calendar className="w-6 h-6 text-[var(--green)] mb-3" />
          <h3 className="text-[17px] font-[650] my-0 mb-1">Medication Schedule</h3>
          <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
            Clear timetables showing exactly which pill to take, at what time of day, with or without meals.
          </p>
        </div>

        <div className="tile">
          <AlertCircle className="w-6 h-6 text-[#8c591c] mb-3" />
          <h3 className="text-[17px] font-[650] my-0 mb-1">Warning Signs (Red Flags)</h3>
          <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
            Key symptoms that indicate you should immediately contact your primary doctor or visit an emergency room.
          </p>
        </div>

        <div className="tile">
          <FileCheck className="w-6 h-6 text-[var(--green)] mb-3" />
          <h3 className="text-[17px] font-[650] my-0 mb-1">Follow-up Appointments</h3>
          <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
            Scheduled specialist evaluations, required blood tests, and imaging follow-up dates.
          </p>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
