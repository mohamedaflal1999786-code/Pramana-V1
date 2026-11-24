import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { UploadCloud, FileSearch, Link2, CheckSquare } from "lucide-react";

export const metadata = {
  title: "How It Works — Pramana-V1",
  description: "Understand the four-stage clinical document intelligence and evidence verification workflow of Pramana-V1.",
};

const WORKFLOW_STAGES = [
  {
    step: "01",
    title: "Authorized Clinical Document Ingestion",
    icon: <UploadCloud className="w-6 h-6" />,
    summary: "Healthcare teams securely associate authorized clinical documentation with an encounter record.",
    details: [
      "Accepts medication administration records (MAR), discharge summaries, physician consultation notes, and lab reports.",
      "Documents are processed in memory with cryptographic hashing to guarantee document integrity.",
      "Strict data isolation: records are stored within private institutional tenant boundaries without public model exposure.",
    ],
  },
  {
    step: "02",
    title: "Multimodal Extraction & Grounding",
    icon: <FileSearch className="w-6 h-6" />,
    summary: "Clinical entities are extracted and tagged with exact document provenance references.",
    details: [
      "Extracts medication names, dosages, administration routes, known allergies, diagnostic codes, and pending lab tests.",
      "Each extracted item is mapped to its exact bounding coordinates and verbatim sentence in the source file.",
      "Uncertainty Quantification: extractions with ambiguity or OCR degradation are explicitly flagged for human confirmation.",
    ],
  },
  {
    step: "03",
    title: "Safety Provenance Graph Construction",
    icon: <Link2 className="w-6 h-6" />,
    summary: "Cross-checks records across care encounters to detect discrepancies and conflicting instructions.",
    details: [
      "Constructs relationships between previous admission records and current discharge orders.",
      "Identifies undocumented omissions during physician handoffs (e.g. cardiac medications not resumed post-procedure).",
      "Validates extracted regimens against institutional clinical reference rules.",
    ],
  },
  {
    step: "04",
    title: "Professional Review & Attestation",
    icon: <CheckSquare className="w-6 h-6" />,
    summary: "A licensed healthcare professional examines the linked evidence and takes final action.",
    details: [
      "Clinicians view the extracted alert side-by-side with the highlighted source record.",
      "Reviewers can verify, modify, or dismiss findings with a single accountable click.",
      "All verification decisions are logged with user identity and timestamp for full institutional auditability.",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main className="wrap py-12">
        <Breadcrumbs items={[{ label: "How It Works" }]} className="mb-6" />

        <PageHeader
          eyebrow="Verification Methodology"
          title={
            <>
              From Information to <span className="font-serif font-normal italic text-[var(--green)]">Accountable Review.</span>
            </>
          }
          description="Pramana-V1 is engineered around an accountable 4-stage pipeline that prioritizes clinical precision, human judgment, and complete source traceability."
        />

        {/* Step-by-Step Breakdown */}
        <section className="space-y-8 mb-16">
          {WORKFLOW_STAGES.map((stage) => (
            <div
              key={stage.step}
              className="p-8 rounded-[12px] bg-white border border-[var(--line)] grid grid-cols-1 lg:grid-cols-[120px_1fr] gap-6 items-start"
            >
              <div className="flex flex-col items-start lg:items-center">
                <span className="text-[28px] font-[750] text-[var(--green)] leading-none mb-3">
                  {stage.step}
                </span>
                <div className="w-12 h-12 rounded-full bg-[#e6ede2] text-[var(--green)] flex items-center justify-center">
                  {stage.icon}
                </div>
              </div>

              <div>
                <h2 className="text-[22px] sm:text-[24px] font-[650] text-[var(--ink)] my-0 mb-2">
                  {stage.title}
                </h2>
                <p className="lead text-[16px] text-[var(--muted)] my-0 mb-4">
                  {stage.summary}
                </p>

                <ul className="space-y-2.5 p-0 m-0 list-none border-t border-[var(--line)] pt-4">
                  {stage.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-[14px] text-[var(--ink)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] mt-2 shrink-0" />
                      <span className="leading-relaxed">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </section>

        {/* Governance Notice */}
        <div className="p-8 rounded-[12px] bg-[#faf9f5] border border-[var(--line)] text-center max-w-2xl mx-auto">
          <span className="num">INSTITUTIONAL GOVERNANCE</span>
          <h3 className="text-[20px] font-[650] my-2">Human Judgment is the Ultimate Safeguard</h3>
          <p className="text-[14px] text-[var(--muted)] leading-relaxed mb-6">
            Pramana-V1 never performs automated prescribing or diagnostic conclusions. The software is intentionally built as an assistive intelligence layer to illuminate discrepancies that might otherwise be overlooked during rapid clinical transitions.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/responsible-ai">
              <Button variant="outline" size="sm">Read Responsible AI Charter</Button>
            </Link>
            <Link href="/contact">
              <Button variant="primary" size="sm">Request Institutional Demo</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
