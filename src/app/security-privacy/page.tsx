import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Lock, Key, Server, EyeOff, ShieldCheck, Database } from "lucide-react";

export const metadata = {
  title: "Security & Privacy — Pramana-V1",
  description: "Learn about the data governance, encryption, and privacy architecture protecting healthcare records in Pramana-V1.",
};

export default function SecurityPrivacyPage() {
  return (
    <>
      <Header />
      <main className="wrap py-12">
        <Breadcrumbs items={[{ label: "Security & Privacy" }]} className="mb-6" />

        <PageHeader
          eyebrow="Data Protection Governance"
          title={
            <>
              Security & Privacy <span className="font-serif font-normal italic text-[var(--green)]">by Design.</span>
            </>
          }
          description="Healthcare intelligence requires the highest tier of confidentiality, data isolation, and accountability. Pramana-V1 is architected to protect sensitive clinical records at every layer."
        />

        {/* Security Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <div className="tile">
            <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mb-4">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-[650] my-0 mb-2">Zero Model Training on Patient Data</h3>
            <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
              Clinical records processed through Pramana-V1 are never retained, stored, or utilized for training underlying foundation models. Extraction pipelines operate under zero-retention data boundaries.
            </p>
          </div>

          <div className="tile">
            <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-[650] my-0 mb-2">Enterprise Encryption Standards</h3>
            <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
              All data in transit is protected using TLS 1.3 encryption. Documents in persistent private storage are secured with industry-standard AES-256 encryption at rest with customer-managed keys.
            </p>
          </div>

          <div className="tile">
            <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mb-4">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-[650] my-0 mb-2">Role-Based Access Control (RBAC)</h3>
            <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
              Granular access controls enforce strict boundaries between clinical reviewers, institutional safety officers, and administrative users. Multi-factor authentication (MFA) is mandatory for clinical accounts.
            </p>
          </div>

          <div className="tile">
            <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-[650] my-0 mb-2">Private Tenant Isolation</h3>
            <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
              Every healthcare institution or research entity operates within isolated database schemas and dedicated document buckets via Supabase private cloud architecture, preventing cross-tenant leakage.
            </p>
          </div>

          <div className="tile">
            <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mb-4">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-[650] my-0 mb-2">Immutable Audit Logging</h3>
            <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
              Every document upload, clinical extraction, provenance query, and professional review decision generates an immutable cryptographic log entry for institutional compliance inspection.
            </p>
          </div>

          <div className="tile">
            <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-[650] my-0 mb-2">Automated De-identification</h3>
            <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
              Optional pre-processing modules detect and redact standard Safe Harbor identifiers before secondary review workflows, ensuring sensitive personal information is minimized whenever possible.
            </p>
          </div>
        </section>

        {/* Compliance Roadmap & Authenticity Notice */}
        <section className="p-8 rounded-[12px] bg-[#faf9f5] border border-[var(--line)]">
          <span className="num">COMPLIANCE READINESS STATEMENT</span>
          <h2 className="text-[22px] font-[650] my-2">Architectural Alignment with HIPAA & GDPR Standards</h2>
          <p className="text-[14px] text-[var(--muted)] leading-relaxed mb-4">
            Pramana-V1 is engineered in accordance with the security and privacy rules of HIPAA (Health Insurance Portability and Accountability Act) and GDPR (General Data Protection Regulation).
          </p>
          <div className="p-4 rounded-[8px] bg-white border border-[var(--line)] text-[13px] text-[var(--muted)]">
            <strong className="text-[var(--ink)] block mb-1">Strict Authenticity Note:</strong>
            As a research-stage platform, formal institutional deployment requires institutional Business Associate Agreements (BAAs), security risk assessments, and clinical IRB review prior to handling live patient records in production clinical wards.
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
