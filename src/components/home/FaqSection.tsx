export default function FaqSection() {
  return (
    <section
      id="about"
      className="section wrap split"
      style={{ borderTop: "1px solid var(--line)" }}
    >
      <div>
        <div className="eyebrow">About Pramana-V1</div>
        <h2>Built around a simple principle.</h2>
        <p className="intro">
          Every alert should be backed by evidence. Developed by Unknown GenZ
          for healthcare and life sciences innovation.
        </p>
      </div>
      <div>
        <details>
          <summary>Is Pramana-V1 ready for clinical use?</summary>
          <p>
            No. It is a research-stage project requiring clinical validation and
            security assessment before real patient use.
          </p>
        </details>
        <details>
          <summary>Does this page process medical records?</summary>
          <p>
            No. This is the public product homepage. Authentication, storage and
            analysis require separate full-stack implementation.
          </p>
        </details>
        <details>
          <summary>Does it replace healthcare professionals?</summary>
          <p>
            No. The intended system supports professional review and does not
            prescribe or diagnose.
          </p>
        </details>
      </div>
    </section>
  );
}
