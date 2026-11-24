import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Lock, Key, Server, EyeOff, ShieldCheck, Database } from "lucide-react";

export const metadata = {
  title: "Security & Privacy Architecture — Pramana-V1",
  description: "Learn about the planned data governance, encryption goals, and privacy architecture for Pramana-V1.",
};

export default function SecurityPrivacyPage() {
  return (
    <>
      <Header />
      <main className="wrap py-12">
        <Breadcrumbs items={[{ label: "Security & Privacy" }]} className="mb-6" />

        <PageHeader
          eyebrow="Planned Data Protection Architecture"
          title={
            <>
              Security & Privacy <span className="font-serif font-normal italic text-[var(--green)]">Design Goals.</span>
            </>
          }
          description="Healthcare intelligence requires rigorous confidentiality, data isolation, and accountability. This overview details the intended technical safeguards and data governance specifications guiding Pramana-V1 development."
        />

        {/* Intended Security Architecture Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <div className="tile">
            <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mb-4">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-[650] my-0 mb-2">Zero Model Training Design Goal</h3>
            <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
              Planned extraction pipelines are specified to operate under strict zero-retention parameters, ensuring processed clinical records are not utilized to train or fine-tune underlying foundation models.
            </p>
          </div>

          <div className="tile">
            <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-[650] my-0 mb-2">Target Encryption Standards</h3>
            <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
              The target architecture specifies TLS 1.3 protocol enforcement for all transmission channels and AES-256 standard encryption for documents stored at rest in institutional storage partitions.
            </p>
          </div>

          <div className="tile">
            <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mb-4">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-[650] my-0 mb-2">Role-Based Access Control (RBAC)</h3>
            <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
              Planned authorization boundaries enforce strict role segregation between clinical attending physicians, reviewing pharmacists, safety officers, and administrative users.
            </p>
          </div>

          <div className="tile">
            <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-[650] my-0 mb-2">Planned Tenant Isolation</h3>
            <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
              Target database architecture specifies schema-level segregation and tenant-specific storage buckets to prevent cross-institutional data commingling.
            </p>
          </div>

          <div className="tile">
            <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mb-4">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-[650] my-0 mb-2">Immutable Audit Trail Design</h3>
            <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
              The platform design incorporates immutable event logging for all document ingestion, entity extractions, and clinician attestation events to facilitate institutional compliance audits.
            </p>
          </div>

          <div className="tile">
            <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-[650] my-0 mb-2">Planned De-identification Layer</h3>
            <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
              Architecture includes an intended pre-processing filter to detect and redact direct patient identifiers prior to secondary research workflows and provenance analysis.
            </p>
          </div>
        </section>

        {/* Intended Compliance Alignment */}
        <section className="p-8 rounded-[12px] bg-[#faf9f5] border border-[var(--line)]">
          <span className="num">RESEARCH DEVELOPMENT STATUS</span>
          <h2 className="text-[22px] font-[650] my-2">Intended Alignment with Healthcare Privacy Standards</h2>
          <p className="text-[14px] text-[var(--muted)] leading-relaxed mb-4">
            Pramana-V1 is an independent research-stage technology project. The security safeguards described herein represent intended architectural targets and development specifications.
          </p>
          <div className="p-4 rounded-[8px] bg-white border border-[var(--line)] text-[13px] text-[var(--muted)]">
            <strong className="text-[var(--ink)] block mb-1">Authenticity & Disclosure Notice:</strong>
            Pramana-V1 does not claim active third-party security certifications (e.g. SOC2, ISO 27001), active HIPAA certification, or completed clinical trial validations. Prior to deployment with live patient data, formal institutional risk evaluations, Institutional Review Board (IRB) approvals, and executed Business Associate Agreements (BAAs) are required.
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
