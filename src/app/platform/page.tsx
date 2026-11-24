import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Network, FileText, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle } from "lucide-react";

export const metadata = {
  title: "Platform — Pramana-V1 Healthcare Intelligence",
  description: "Explore the core capabilities of Pramana-V1: Safety Provenance Graph, clinical extraction, and human-verified patient safety checks.",
};

export default function PlatformPage() {
  return (
    <>
      <Header />
      <main className="wrap py-12">
        <Breadcrumbs items={[{ label: "Platform" }]} className="mb-6" />

        <PageHeader
          eyebrow="Clinical Intelligence Architecture"
          title={
            <>
              Clarity Across the <span className="font-serif font-normal italic text-[var(--green)]">Care Journey.</span>
            </>
          }
          description="Pramana-V1 connects fragmented clinical documentation across admissions, lab panels, medication sheets, and handoff summaries to surface safety concerns backed by traceable evidence."
          actions={
            <div className="flex gap-3">
              <Link href="/auth/signup">
                <Button variant="primary">Access Workspace ↗</Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="outline">View Clinical Workflow</Button>
              </Link>
            </div>
          }
        />

        {/* Core Innovation: Safety Provenance Graph */}
        <section className="mb-16">
          <div className="tile big p-8 sm:p-12 mb-8">
            <div className="max-w-3xl">
              <span className="num">01 / CORE INNOVATION</span>
              <h2 className="text-[28px] sm:text-[36px] font-[650] tracking-[-0.04em] my-3 text-[var(--ink)]">
                The Safety Provenance Graph
              </h2>
              <p className="text-[17px] text-[var(--muted)] leading-relaxed mb-6">
                Unlike opaque AI systems that generate summaries without traceability, Pramana-V1 constructs a verified provenance graph. Every surfaced discrepancy or safety warning is mathematically and textually anchored to its source document, extraction timestamp, and applicable reference rule.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-[12px] border border-[var(--line)] mt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)]">
                  <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <strong className="block text-[15px] text-[var(--ink)] mb-1">Source Document</strong>
                  <span className="text-[12px] text-[var(--muted)]">Prescriptions, labs, discharge summaries</span>
                </div>

                <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)]">
                  <div className="w-10 h-10 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center mx-auto mb-3">
                    <Network className="w-5 h-5" />
                  </div>
                  <strong className="block text-[15px] text-[var(--ink)] mb-1">Structured Extraction</strong>
                  <span className="text-[12px] text-[var(--muted)]">Token-grounded clinical entities with confidence indices</span>
                </div>

                <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)]">
                  <div className="w-10 h-10 rounded-full bg-[#faeee8] text-[#9c3e21] flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <strong className="block text-[15px] text-[var(--ink)] mb-1">Safety Cross-Check</strong>
                  <span className="text-[12px] text-[var(--muted)]">Allergy conflicts, dose limits, handoff gaps</span>
                </div>

                <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)]">
                  <div className="w-10 h-10 rounded-full bg-[#e5f1df] text-[#145a45] flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <strong className="block text-[15px] text-[var(--ink)] mb-1">Professional Review</strong>
                  <span className="text-[12px] text-[var(--muted)]">Human attestation and verification sign-off</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Platform Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="tile">
              <span className="num">02 / DOCUMENT INTELLIGENCE</span>
              <h3 className="text-[22px] font-[650] my-3">Multi-Source Clinical Ingestion</h3>
              <p className="text-[var(--muted)] leading-relaxed">
                Accepts unstructured scanned reports, electronic transfer notes, laboratory PDFs, and discharge instructions. Documents remain immutable, preserving original cryptographic hashes for rigorous auditing.
              </p>
              <div className="mt-4 pt-4 border-t border-[var(--line)] flex gap-2">
                <Badge variant="verified">PDF Support</Badge>
                <Badge variant="verified">HL7-Ready</Badge>
                <Badge variant="unverified">Private Storage</Badge>
              </div>
            </article>

            <article className="tile">
              <span className="num">03 / MEDICATION SAFETY</span>
              <h3 className="text-[22px] font-[650] my-3">Discrepancy & Allergy Detection</h3>
              <p className="text-[var(--muted)] leading-relaxed">
                Cross-references active prescriptions against recorded patient allergy histories and admission notes. Flags dosage mismatches and omission of essential transition medications across care shifts.
              </p>
              <div className="mt-4 pt-4 border-t border-[var(--line)] flex gap-2">
                <Badge variant="discrepancy" dot>Discrepancy Audit</Badge>
                <Badge variant="pending">Conflict Matrix</Badge>
              </div>
            </article>

            <article className="tile">
              <span className="num">04 / CLINICAL CONTINUITY</span>
              <h3 className="text-[22px] font-[650] my-3">Longitudinal History Organization</h3>
              <p className="text-[var(--muted)] leading-relaxed">
                Synthesizes disparate encounters into an organized chronological safety record. Enables attending clinicians to review laboratory trends, past interventions, and specialist notes in a single unified view.
              </p>
              <div className="mt-4 pt-4 border-t border-[var(--line)] flex gap-2">
                <Badge variant="default">Timeline View</Badge>
                <Badge variant="default">Trend Tracking</Badge>
              </div>
            </article>

            <article className="tile">
              <span className="num">05 / HUMAN OVERSIGHT</span>
              <h3 className="text-[22px] font-[650] my-3">Verification & Attestation Queue</h3>
              <p className="text-[var(--muted)] leading-relaxed">
                No autonomous decisions. Every alert enters a prioritized verification queue where qualified healthcare practitioners review the exact textual excerpt and either endorse, adjust, or dismiss the finding.
              </p>
              <div className="mt-4 pt-4 border-t border-[var(--line)] flex gap-2">
                <Badge variant="verified" dot>Human-in-the-Loop</Badge>
                <Badge variant="default">Audit Stamp</Badge>
              </div>
            </article>
          </div>
        </section>

        {/* Bottom Callout */}
        <div className="p-8 sm:p-10 rounded-[12px] bg-[#16392e] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="eyebrow text-[#c3d8c8] mb-2">Research Access</div>
            <h3 className="text-[24px] font-[650] my-0 mb-2">Evaluate Pramana-V1 for Your Institution</h3>
            <p className="text-[14px] text-[#c3d8c8] my-0 leading-relaxed">
              Explore how evidence-grounded provenance graphs improve clinical communication and reduce documentation handoff discrepancies.
            </p>
          </div>
          <Link href="/auth/signup">
            <Button variant="primary" className="bg-white text-[var(--green)] hover:bg-[#e9eee6] shrink-0">
              Create Research Account →
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
