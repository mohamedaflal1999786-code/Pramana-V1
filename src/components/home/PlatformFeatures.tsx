export default function PlatformFeatures() {
  return (
    <section id="platform" className="section wrap">
      <div className="eyebrow">The platform</div>
      <h2>Clarity across the care journey.</h2>
      <p className="intro">
        Important details can be lost between prescriptions, reports and
        transfer summaries. Pramana-V1 is designed to connect these records and
        surface discrepancies for review.
      </p>
      <div className="features">
        <article className="tile big">
          <div>
            <span className="num">01 / CORE INNOVATION</span>
            <h3>Safety Provenance Graph</h3>
            <p>
              Trace a potential concern back to its source document, extracted
              information and applicable reference rule.
            </p>
          </div>
          <svg
            className="mini"
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
            <g fontSize="13" textAnchor="middle" fill="#244b39">
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
        <article className="tile">
          <span className="num">02 / DOCUMENTS</span>
          <h3>Intelligent extraction</h3>
          <p>
            Structure clinical documents while keeping the original source
            available for correction and verification.
          </p>
        </article>
        <article className="tile">
          <span className="num">03 / SAFETY</span>
          <h3>Medication & handoff checks</h3>
          <p>
            Surface documented allergy conflicts, medication discrepancies and
            missing transfer information.
          </p>
        </article>
        <article className="tile">
          <span className="num">04 / CONTINUITY</span>
          <h3>Longitudinal records</h3>
          <p>
            Organize laboratory trends and clinical history for professional
            assessment.
          </p>
        </article>
        <article className="tile">
          <span className="num">05 / COMMUNICATION</span>
          <h3>Accessible discharge guidance</h3>
          <p>
            Support multilingual explanations of professionally approved
            instructions.
          </p>
        </article>
      </div>
    </section>
  );
}
