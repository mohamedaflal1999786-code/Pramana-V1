export default function HeroSection() {
  return (
    <section className="hero wrap grid grid-cols-[1.05fr_1fr] max-md:grid-cols-1 gap-12 max-md:gap-[30px] items-center pt-[88px] pb-[92px] max-md:py-[55px]">
      <div>
        <div className="eyebrow">Evidence-driven healthcare intelligence</div>
        <h1 className="text-[clamp(48px,6vw,88px)] leading-[1.02] tracking-[-0.065em] my-[22px] mb-[26px] font-[650] text-[var(--ink)]">
          Every decision
          <br />
          deserves{" "}
          <em className="font-serif font-normal text-[var(--green)] not-italic">
            evidence.
          </em>
        </h1>
        <p className="lead">
          Connect fragmented clinical information, identify potential safety
          concerns and bring the original evidence into every professional
          review.
        </p>
        <div className="actions flex gap-3 flex-wrap mt-8">
          <a className="btn" href="#platform">
            Explore the platform →
          </a>
          <a className="btn outline" href="#workflow">
            How it works
          </a>
        </div>
        <p className="note text-[12px] text-[var(--muted)] mt-[22px]">
          Research-stage software · Designed for human oversight
        </p>
      </div>

      <div className="art bg-[#e7ece1] rounded-[18px] overflow-hidden relative aspect-[1/1.04] max-md:aspect-[1.15] grid place-items-center">
        <svg
          viewBox="0 0 560 520"
          role="img"
          aria-label="Conceptual illustration of documents connected to an evidence verification shield"
          className="w-full h-auto"
        >
          <defs>
            <linearGradient id="g" x2="1" y2="1">
              <stop stopColor="#f9faf4" />
              <stop offset="1" stopColor="#c4d8c5" />
            </linearGradient>
            <linearGradient id="s" x2="1" y2="1">
              <stop stopColor="#32795e" />
              <stop offset="1" stopColor="#103c30" />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow
                dx="0"
                dy="12"
                stdDeviation="12"
                floodColor="#244a36"
                floodOpacity=".17"
              />
            </filter>
          </defs>
          <circle cx="280" cy="250" r="202" fill="none" stroke="#b8cbb8" />
          <circle
            cx="280"
            cy="250"
            r="155"
            fill="none"
            stroke="#b8cbb8"
            strokeDasharray="3 8"
          />
          <path
            d="M130 130 280 250 430 130M130 370 280 250 430 370"
            stroke="#789b82"
            strokeWidth="2"
            fill="none"
          />
          <g filter="url(#shadow)">
            <rect
              x="55"
              y="77"
              width="150"
              height="108"
              rx="12"
              fill="url(#g)"
            />
            <rect
              x="355"
              y="77"
              width="150"
              height="108"
              rx="12"
              fill="url(#g)"
            />
            <rect
              x="55"
              y="315"
              width="150"
              height="108"
              rx="12"
              fill="url(#g)"
            />
            <rect
              x="355"
              y="315"
              width="150"
              height="108"
              rx="12"
              fill="url(#g)"
            />
            <path
              d="M280 143 373 183v69c0 57-45 96-93 116-48-20-93-59-93-116v-69Z"
              fill="url(#s)"
              stroke="#85b397"
              strokeWidth="2"
            />
            <path
              d="m239 249 28 28 55-65"
              fill="none"
              stroke="#e5f1df"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <g
            fill="#244b39"
            fontFamily="system-ui"
            fontSize="15"
            fontWeight="600"
            textAnchor="middle"
          >
            <text x="130" y="155">
              Clinical records
            </text>
            <text x="430" y="155">
              Safety rules
            </text>
            <text x="130" y="394">
              Source evidence
            </text>
            <text x="430" y="394">
              Human review
            </text>
          </g>
          <g stroke="#527b62" strokeWidth="2" fill="none">
            <path d="M117 96h26v34h-26z M123 106h14m-14 7h14m-14 7h9" />
            <path d="M416 113l9 9 19-22" />
            <circle cx="130" cy="349" r="13" />
            <path d="m140 359 10 10" />
            <circle cx="430" cy="343" r="9" />
            <path d="M413 368q17-24 34 0" />
          </g>
        </svg>
        <div className="artlabel absolute bottom-5 left-6 text-[11px] tracking-[1.4px] text-[#365b4a] font-semibold">
          01 / THE EVIDENCE NETWORK · CONCEPT
        </div>
      </div>
    </section>
  );
}
