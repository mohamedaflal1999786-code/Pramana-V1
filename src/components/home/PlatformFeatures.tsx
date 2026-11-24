import type { FeatureItem } from "@/types";

const SECONDARY_FEATURES: FeatureItem[] = [
  {
    id: "extract",
    tag: "02 / DOCUMENTS",
    title: "Intelligent extraction",
    description:
      "Structure clinical documents while keeping the original source available for correction and verification.",
  },
  {
    id: "safety",
    tag: "03 / SAFETY",
    title: "Medication & handoff checks",
    description:
      "Surface documented allergy conflicts, medication discrepancies and missing transfer information.",
  },
  {
    id: "continuity",
    tag: "04 / CONTINUITY",
    title: "Longitudinal records",
    description:
      "Organize laboratory trends and clinical history for professional assessment.",
  },
  {
    id: "communication",
    tag: "05 / COMMUNICATION",
    title: "Accessible discharge guidance",
    description:
      "Support multilingual explanations of professionally approved instructions.",
  },
];

export default function PlatformFeatures() {
  return (
    <section id="platform" className="section wrap">
      <div className="eyebrow">The platform</div>
      <h2 className="text-[clamp(34px,4.5vw,58px)] leading-[1.08] tracking-[-0.05em] font-[650] max-w-[760px] my-4 mb-6">
        Clarity across the care journey.
      </h2>
      <p className="intro">
        Important details can be lost between prescriptions, reports and
        transfer summaries. Pramana-V1 is designed to connect these records and
        surface discrepancies for review.
      </p>

      <div className="features grid grid-cols-[1.15fr_1fr] max-md:grid-cols-1 gap-4 mt-10">
        <article className="tile big row-span-2 max-md:row-span-1">
          <div>
            <span className="num">01 / CORE INNOVATION</span>
            <h3 className="text-[24px] tracking-[-0.8px] my-4 mb-[10px]">
              Safety Provenance Graph
            </h3>
            <p className="text-[var(--muted)] mb-0">
              Trace a potential concern back to its source document, extracted
              information and applicable reference rule.
            </p>
          </div>
          <svg
            className="mini w-full max-h-[180px] mt-[30px]"
            viewBox="0 0 400 150"
            role="img"
            aria-label="Source document connected to evidence and review"
          >
            <path
              d="M70 75H330"
              stroke="#739680"
              strokeWidth="2"
              strokeDasharray="5 5"
            />
            <g fill="#fff" stroke="#9bb4a0">
              <rect x="5" y="50" width="110" height="50" rx="8" />
              <rect x="145" y="50" width="110" height="50" rx="8" />
              <rect x="285" y="50" width="110" height="50" rx="8" />
            </g>
            <g
              fontSize="13"
              textAnchor="middle"
              fill="#244b39"
              fontWeight="500"
            >
              <text x="60" y="79">
                Document
              </text>
              <text x="200" y="79">
                Evidence
              </text>
              <text x="340" y="79">
                Review
              </text>
            </g>
          </svg>
        </article>

        {SECONDARY_FEATURES.map((feature) => (
          <article key={feature.id} className="tile">
            <span className="num">{feature.tag}</span>
            <h3 className="text-[24px] tracking-[-0.8px] my-4 mb-[10px]">
              {feature.title}
            </h3>
            <p className="text-[var(--muted)] mb-0">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
