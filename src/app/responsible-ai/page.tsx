import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { CheckCircle2, AlertCircle, Eye, FileText } from "lucide-react";

export const metadata = {
  title: "Responsible AI — Pramana-V1",
  description: "Read the Responsible AI Charter and human-in-the-loop ethical guidelines governing Pramana-V1.",
};

export default function ResponsibleAiPage() {
  return (
    <>
      <Header />
      <main className="wrap py-12">
        <Breadcrumbs items={[{ label: "Responsible AI" }]} className="mb-6" />

        <PageHeader
          eyebrow="Ethical Intelligence Charter"
          title={
            <>
              Accountability by <span className="font-serif font-normal italic text-[var(--green)]">Design.</span>
            </>
          }
          description="In healthcare and life sciences, artificial intelligence must never operate as an unscrutinized black box. Pramana-V1 enforces strict boundaries that put human clinical judgment and full evidentiary traceability first."
        />

        {/* 4 Pillars of Responsible AI */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 rounded-[12px] bg-white border border-[var(--line)]">
            <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mb-4">
              <Eye className="w-5 h-5" />
            </div>
            <h2 className="text-[20px] font-[650] my-0 mb-3 text-[var(--ink)]">
              1. Non-Autonomous Assistance
            </h2>
            <p className="text-[14px] text-[var(--muted)] leading-relaxed my-0">
              Pramana-V1 does not independently diagnose diseases, authorize prescriptions, or execute clinical orders. The software is strictly categorized as assistive clinical intelligence: its purpose is to surface potential discrepancies for human professional assessment, never to substitute for qualified clinical oversight.
            </p>
          </div>

          <div className="p-8 rounded-[12px] bg-white border border-[var(--line)]">
            <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-[20px] font-[650] my-0 mb-3 text-[var(--ink)]">
              2. Mandatory Evidence Traceability
            </h2>
            <p className="text-[14px] text-[var(--muted)] leading-relaxed my-0">
              No assertion is presented without its grounding pedigree. Every highlighted medication conflict, allergy discrepancy, or transfer oversight must link directly to the specific sentence, paragraph, and page of the uploaded patient record.
            </p>
          </div>

          <div className="p-8 rounded-[12px] bg-white border border-[var(--line)]">
            <div className="w-10 h-10 rounded-full bg-[#faeee8] text-[#9c3e21] flex items-center justify-center mb-4">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h2 className="text-[20px] font-[650] my-0 mb-3 text-[var(--ink)]">
              3. Transparent Uncertainty Quantification
            </h2>
            <p className="text-[14px] text-[var(--muted)] leading-relaxed my-0">
              When extraction confidence is reduced—whether due to degraded scans, ambiguous handwriting, or conflicting provider notes—the system explicitly highlights its uncertainty. Clinicians are warned rather than given false impressions of certainty.
            </p>
          </div>

          <div className="p-8 rounded-[12px] bg-white border border-[var(--line)]">
            <div className="w-10 h-10 rounded-full bg-[#e5f1df] text-[#145a45] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="text-[20px] font-[650] my-0 mb-3 text-[var(--ink)]">
              4. Algorithmic Auditability & Sign-off
            </h2>
            <p className="text-[14px] text-[var(--muted)] leading-relaxed my-0">
              Every flagged record includes an auditable trail: which model extraction pipeline processed the file, what reference guidelines were evaluated, and which healthcare professional verified or rejected the finding.
            </p>
          </div>
        </section>

        {/* Ethical Red Lines */}
        <section className="p-8 sm:p-10 rounded-[12px] bg-[#16392e] text-white mb-16">
          <div className="max-w-3xl">
            <div className="eyebrow text-[#c3d8c8] mb-2">Institutional Safeguards</div>
            <h2 className="text-[26px] font-[650] my-0 mb-4">Our Ethical Red Lines</h2>
            <ul className="space-y-4 list-none p-0 m-0 text-[14px] text-[#c3d8c8]">
              <li className="flex items-start gap-3">
                <span className="text-[#85b397] font-bold">✕</span>
                <span><strong>No Generative Hallucinations in Clinical Logic</strong>: Summary text cannot fabricate lab results or invent symptoms that are absent from source records.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#85b397] font-bold">✕</span>
                <span><strong>No Secret Algorithms</strong>: Extraction prompts, grounding heuristics, and discrepancy rules remain transparent and auditable by institutional safety boards.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#85b397] font-bold">✕</span>
                <span><strong>No Circumvention of Attending Physician Authority</strong>: Pramana-V1 never overrides professional clinical orders.</span>
              </li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
