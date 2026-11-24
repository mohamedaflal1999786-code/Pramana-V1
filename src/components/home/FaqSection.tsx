import type { FaqItem } from "@/types";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is Pramana-V1 ready for clinical use?",
    answer:
      "No. It is a research-stage project requiring clinical validation and security assessment before real patient use.",
  },
  {
    question: "Does this page process medical records?",
    answer:
      "No. This is the public product homepage. Authentication, storage and analysis require separate full-stack implementation.",
  },
  {
    question: "Does it replace healthcare professionals?",
    answer:
      "No. The intended system supports professional review and does not prescribe or diagnose.",
  },
];

export default function FaqSection() {
  return (
    <section
      id="about"
      className="section wrap split grid grid-cols-2 max-md:grid-cols-1 gap-16 max-md:gap-[30px] items-start border-t border-[var(--line)]"
    >
      <div>
        <div className="eyebrow">About Pramana-V1</div>
        <h2 className="text-[clamp(34px,4.5vw,58px)] leading-[1.08] tracking-[-0.05em] font-[650] max-w-[760px] my-4 mb-6">
          Built around a simple principle.
        </h2>
        <p className="intro">
          Every alert should be backed by evidence. Developed by Unknown GenZ
          for healthcare and life sciences innovation.
        </p>
      </div>

      <div>
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.question}
            className="border-b border-[var(--line)] py-[18px] group"
          >
            <summary className="cursor-pointer font-[650] text-[var(--ink)] hover:text-[var(--green)] transition-colors list-none flex justify-between items-center select-none">
              <span>{item.question}</span>
              <span className="text-[var(--muted)] text-sm group-open:rotate-180 transition-transform duration-200">
                ▾
              </span>
            </summary>
            <p className="my-3 mb-1 text-[var(--muted)] leading-relaxed">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
