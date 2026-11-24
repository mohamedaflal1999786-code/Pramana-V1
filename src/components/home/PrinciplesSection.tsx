import type { PrincipleRule } from "@/types";

const PRINCIPLES: PrincipleRule[] = [
  {
    title: "Authorized access",
    description:
      "Role-based permissions and private document storage are planned requirements.",
  },
  {
    title: "Evidence, not guesses",
    description:
      "Uncertain extraction requires confirmation. Alerts should reference their sources.",
  },
  {
    title: "Human oversight",
    description: "No autonomous diagnosis, prescribing or clinical approval.",
  },
];

export default function PrinciplesSection() {
  return (
    <section
      id="principles"
      className="section wrap split grid grid-cols-2 max-md:grid-cols-1 gap-16 max-md:gap-[30px] items-start"
    >
      <div>
        <div className="eyebrow">Responsible by design</div>
        <h2 className="text-[clamp(34px,4.5vw,58px)] leading-[1.08] tracking-[-0.05em] font-[650] max-w-[760px] my-4 mb-6">
          Trust is built through accountability.
        </h2>
        <p className="intro">
          Our implementation priorities put privacy, transparency and
          professional judgment first.
        </p>
      </div>

      <div className="rules border-t border-[var(--line)]">
        {PRINCIPLES.map((rule) => (
          <div
            key={rule.title}
            className="rule py-5 border-b border-[var(--line)]"
          >
            <strong className="block text-[18px] text-[var(--ink)] font-semibold">
              {rule.title}
            </strong>
            <p className="mt-[5px] mb-0 text-[var(--muted)] leading-relaxed">
              {rule.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
