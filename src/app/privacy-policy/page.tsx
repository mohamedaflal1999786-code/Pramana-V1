import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "Privacy Policy — Pramana-V1",
  description: "Review the Privacy Policy governing Pramana-V1 and institutional health data handling.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="wrap py-12">
        <Breadcrumbs items={[{ label: "Privacy Policy" }]} className="mb-6" />

        <PageHeader
          eyebrow="Legal & Data Governance"
          title="Privacy Policy"
          description="Effective Date: November 2026 · Governing the Pramana-V1 Healthcare Intelligence Platform developed by Unknown GenZ."
        />

        <div className="max-w-4xl space-y-8 text-[15px] text-[var(--ink)] leading-relaxed">
          <section className="tile">
            <h2 className="text-[20px] font-[650] my-0 mb-3 text-[var(--green)]">1. Purpose and Scope</h2>
            <p className="text-[var(--muted)] my-0 mb-3">
              This Privacy Policy explains how Pramana-V1 (&ldquo;the Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) collects, protects, isolates, and processes information when authorized users and institutions evaluate or operate our software.
            </p>
            <p className="text-[var(--muted)] my-0">
              Pramana-V1 is a research-stage patient safety intelligence platform designed for institutional review. We operate with strict adherence to data minimization principles.
            </p>
          </section>

          <section className="tile">
            <h2 className="text-[20px] font-[650] my-0 mb-3 text-[var(--green)]">2. Protected Health Information (PHI) Principles</h2>
            <p className="text-[var(--muted)] my-0 mb-3">
              When clinical documentation is uploaded to Pramana-V1:
            </p>
            <ul className="space-y-2 text-[var(--muted)] p-0 m-0 pl-5">
              <li><strong>Zero Foundation Model Training</strong>: Uploaded records are strictly processed in memory for entity extraction and provenance graph generation; they are never utilized to train or fine-tune public foundation AI models.</li>
              <li><strong>Tenant Isolation</strong>: Documents and extracted tokens are segregated within private institutional storage partitions with distinct access policies.</li>
              <li><strong>Cryptographic Verification</strong>: Document hashes are recorded to verify that files are never altered or tampered with during extraction.</li>
            </ul>
          </section>

          <section className="tile">
            <h2 className="text-[20px] font-[650] my-0 mb-3 text-[var(--green)]">3. User & Account Data</h2>
            <p className="text-[var(--muted)] my-0 mb-3">
              We collect minimal account credentials for authorized clinical reviewers: name, institutional email, professional role, and multi-factor authentication (MFA) credentials.
            </p>
            <p className="text-[var(--muted)] my-0">
              We do not sell, license, or monetize reviewer or institutional telemetry to third parties under any circumstance.
            </p>
          </section>

          <section className="tile">
            <h2 className="text-[20px] font-[650] my-0 mb-3 text-[var(--green)]">4. Data Retention & Deletion</h2>
            <p className="text-[var(--muted)] my-0 mb-3">
              Institutional administrators retain complete sovereignty over uploaded data. Authorized administrators may trigger complete tenant purging, upon which all associated files, extracted graphs, and audit records are permanently expunged from persistent storage within 24 hours.
            </p>
          </section>

          <section className="tile">
            <h2 className="text-[20px] font-[650] my-0 mb-3 text-[var(--green)]">5. Institutional Inquiries</h2>
            <p className="text-[var(--muted)] my-0">
              For questions regarding our privacy architecture, Business Associate Agreements (BAAs), or security audits, contact the Unknown GenZ team through our <a href="/contact" className="text-[var(--green)] underline">Institutional Contact Portal</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
