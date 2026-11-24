import type { WorkflowStep } from "@/types";

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    stepNumber: "01",
    title: "Upload",
    description: "Associate authorized clinical documents with a record.",
  },
  {
    stepNumber: "02",
    title: "Extract",
    description: "Identify structured information and flag uncertainty.",
  },
  {
    stepNumber: "03",
    title: "Connect",
    description: "Compare records and link potential concerns to evidence.",
  },
  {
    stepNumber: "04",
    title: "Review",
    description:
      "Allow a qualified professional to verify or reject the concern.",
  },
];

export default function WorkflowSection() {
  return (
    <section
      id="workflow"
      className="section dark-section bg-[#16392e] text-white"
    >
      <div className="wrap">
        <div className="eyebrow text-[#c3d8c8]">The intended workflow</div>
        <h2 className="text-[clamp(34px,4.5vw,58px)] leading-[1.08] tracking-[-0.05em] font-[650] max-w-[760px] my-4 mb-6">
          From information to accountable review.
        </h2>

        <div className="steps grid grid-cols-4 max-md:grid-cols-1 gap-6 mt-12">
          {WORKFLOW_STEPS.map((step) => (
            <article
              key={step.stepNumber}
              className="step border-t border-[#779185] pt-[22px]"
            >
              <span className="text-[#b6d0bd] text-[13px] font-semibold">
                {step.stepNumber}
              </span>
              <h3 className="my-[14px] mb-2 text-[21px] font-bold">
                {step.title}
              </h3>
              <p className="text-[#c3d8c8] text-[14px] leading-relaxed">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
