import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Shield, BookOpen, Users, Compass } from "lucide-react";

export const metadata = {
  title: "About Pramana-V1 — Unknown GenZ",
  description: "Learn about the mission, team, and patient safety principles behind Pramana-V1.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="wrap py-12">
        <Breadcrumbs items={[{ label: "About" }]} className="mb-6" />

        <PageHeader
          eyebrow="About Pramana-V1"
          title={
            <>
              Built Around a Simple <span className="font-serif font-normal italic text-[var(--green)]">Principle.</span>
            </>
          }
          description="Every alert should be backed by evidence. Pramana-V1 is conceived and developed by Unknown GenZ for healthcare and life sciences innovation."
        />

        {/* Mission & Background */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-16">
          <div>
            <span className="num">01 / OUR ORIGIN</span>
            <h2 className="text-[26px] font-[650] my-3">The Challenge of Fragmented Records</h2>
            <p className="text-[15px] text-[var(--muted)] leading-relaxed mb-4">
              Modern clinical care takes place across fragmented platforms: handwritten prescriptions, electronic health record handoffs, PDF laboratory panels, and verbal shift updates. When a patient transitions between an emergency department, an intensive care unit, and a general ward, critical safety details are at risk of being lost.
            </p>
            <p className="text-[15px] text-[var(--muted)] leading-relaxed mb-6">
              Our team—<strong>Unknown GenZ</strong>—set out to build software that bridges these documentation gaps without introducing opaque, unverifiable artificial intelligence.
            </p>
          </div>

          <div className="bg-[#e6ede2] p-8 rounded-[12px] border border-[var(--line)]">
            <span className="num">02 / ETYMOLOGY</span>
            <h3 className="text-[22px] font-[650] my-2 text-[var(--ink)]">Why &ldquo;Pramana&rdquo;?</h3>
            <p className="text-[14px] text-[var(--muted)] leading-relaxed mb-4">
              In classical philosophical traditions, <em>Pramana</em> (प्रमाण) signifies the epistemological means through which true knowledge and valid proof are acquired.
            </p>
            <p className="text-[14px] text-[var(--muted)] leading-relaxed my-0">
              In healthcare safety, true knowledge requires verification: no alert should exist in a vacuum, and every recommendation must be tethered directly to original, uncorrupted clinical proof.
            </p>
          </div>
        </section>

        {/* Core Values */}
        <section className="mb-16">
          <div className="eyebrow mb-2">Development Values</div>
          <h2 className="text-[28px] font-[650] mb-8">Four Commitments to Healthcare Integrity</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="tile">
              <Shield className="w-6 h-6 text-[var(--green)] mb-3" />
              <h3 className="text-[18px] font-[650] my-0 mb-2">Patient Safety First</h3>
              <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
                We prioritize clinical precision over novelty. Flagging false positives is preferable to missing critical contraindications.
              </p>
            </div>

            <div className="tile">
              <BookOpen className="w-6 h-6 text-[var(--green)] mb-3" />
              <h3 className="text-[18px] font-[650] my-0 mb-2">Provenance Traceability</h3>
              <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
                Black-box summaries are prohibited. Every extracted entity links to its exact line, paragraph, and source document.
              </p>
            </div>

            <div className="tile">
              <Users className="w-6 h-6 text-[var(--green)] mb-3" />
              <h3 className="text-[18px] font-[650] my-0 mb-2">Human Professional Control</h3>
              <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
                Qualified medical practitioners retain final decision-making power. Software assists and structures; humans decide.
              </p>
            </div>

            <div className="tile">
              <Compass className="w-6 h-6 text-[var(--green)] mb-3" />
              <h3 className="text-[18px] font-[650] my-0 mb-2">Strict Authenticity</h3>
              <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
                We do not simulate clinical outcomes, generate fake testimonials, or exaggerate validation readiness.
              </p>
            </div>
          </div>
        </section>

        {/* Research Stage Notice */}
        <section className="p-8 rounded-[12px] bg-[#16392e] text-white">
          <div className="max-w-2xl">
            <span className="text-[11px] font-[750] tracking-[1.4px] text-[#c3d8c8] uppercase block mb-2">
              Research-Stage Disclosure
            </span>
            <h3 className="text-[22px] font-[650] my-0 mb-3">Independent Healthcare Research Project</h3>
            <p className="text-[14px] text-[#c3d8c8] leading-relaxed mb-6">
              Pramana-V1 is actively in research and development. It is designed for institutional piloting, clinical workflow studies, and evidence validation. It does not replace certified electronic health record systems or professional clinical diagnosis.
            </p>
            <Link href="/contact">
              <Button variant="primary" className="bg-white text-[var(--green)] hover:bg-[#e9eee6]">
                Contact Research Team →
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
