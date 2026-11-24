import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "Terms of Use — Pramana-V1",
  description: "Review the Terms of Use and research license governing Pramana-V1.",
};

export default function TermsOfUsePage() {
  return (
    <>
      <Header />
      <main className="wrap py-12">
        <Breadcrumbs items={[{ label: "Terms of Use" }]} className="mb-6" />

        <PageHeader
          eyebrow="Research License & Agreement"
          title="Terms of Use"
          description="Effective Date: November 2026 · Governing the Pramana-V1 Healthcare Intelligence Platform developed by Unknown GenZ."
        />

        <div className="max-w-4xl space-y-8 text-[15px] text-[var(--ink)] leading-relaxed">
          <section className="tile">
            <h2 className="text-[20px] font-[650] my-0 mb-3 text-[var(--green)]">1. Nature of the Software</h2>
            <p className="text-[var(--muted)] my-0 mb-3">
              Pramana-V1 is an evidence-driven research-stage healthcare intelligence application. It is engineered to assist healthcare professionals in identifying potential documentation discrepancies and tracing alerts back to source clinical records.
            </p>
            <p className="text-[var(--muted)] my-0 font-semibold text-[var(--ink)]">
              Pramana-V1 does not practice medicine, prescribe pharmaceuticals, formulate medical diagnoses, or substitute for the clinical judgment of qualified licensed healthcare providers.
            </p>
          </section>

          <section className="tile">
            <h2 className="text-[20px] font-[650] my-0 mb-3 text-[var(--green)]">2. Authorized Use & Clinical Responsibility</h2>
            <p className="text-[var(--muted)] my-0 mb-3">
              Users of Pramana-V1 agree to the following terms:
            </p>
            <ul className="space-y-2 text-[var(--muted)] p-0 m-0 pl-5">
              <li>Users must possess appropriate institutional authorization and credentials before uploading or viewing patient records.</li>
              <li>Attending clinicians remain exclusively responsible for verifying all extracted findings and executing clinical interventions.</li>
              <li>Software alerts, provenance graphs, and discrepancy flags must be independently confirmed prior to affecting patient care plans.</li>
            </ul>
          </section>

          <section className="tile">
            <h2 className="text-[20px] font-[650] my-0 mb-3 text-[var(--green)]">3. Limitation of Liability</h2>
            <p className="text-[var(--muted)] my-0 mb-3">
              To the maximum extent permitted under applicable law, Unknown GenZ and its developers disclaim liability for any indirect, incidental, or consequential damages resulting from clinical reliance on unverified extractions or unconfirmed alerts generated during software evaluation.
            </p>
          </section>

          <section className="tile">
            <h2 className="text-[20px] font-[650] my-0 mb-3 text-[var(--green)]">4. Intellectual Property</h2>
            <p className="text-[var(--muted)] my-0">
              The Safety Provenance Graph architecture, design system, and proprietary algorithms of Pramana-V1 are the intellectual property of Unknown GenZ. User institutions retain complete and exclusive ownership of all uploaded clinical records and derived patient health data.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
