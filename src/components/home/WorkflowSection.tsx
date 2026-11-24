export default function WorkflowSection() {
  return (
    <section id="workflow" className="section dark">
      <div className="wrap">
        <div className="eyebrow">The intended workflow</div>
        <h2>From information to accountable review.</h2>
        <div className="steps">
          <article className="step">
            <span>01</span>
            <h3>Upload</h3>
            <p>Associate authorized clinical documents with a record.</p>
          </article>
          <article className="step">
            <span>02</span>
            <h3>Extract</h3>
            <p>Identify structured information and flag uncertainty.</p>
          </article>
          <article className="step">
            <span>03</span>
            <h3>Connect</h3>
            <p>Compare records and link potential concerns to evidence.</p>
          </article>
          <article className="step">
            <span>04</span>
            <h3>Review</h3>
            <p>Allow a qualified professional to verify or reject the concern.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
