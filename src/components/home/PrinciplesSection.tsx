export default function PrinciplesSection() {
  return (
    <section id="principles" className="section wrap split">
      <div>
        <div className="eyebrow">Responsible by design</div>
        <h2>Trust is built through accountability.</h2>
        <p className="intro">
          Our implementation priorities put privacy, transparency and
          professional judgment first.
        </p>
      </div>
      <div className="rules">
        <div className="rule">
          <strong>Authorized access</strong>
          <p>
            Role-based permissions and private document storage are planned
            requirements.
          </p>
        </div>
        <div className="rule">
          <strong>Evidence, not guesses</strong>
          <p>
            Uncertain extraction requires confirmation. Alerts should reference
            their sources.
          </p>
        </div>
        <div className="rule">
          <strong>Human oversight</strong>
          <p>No autonomous diagnosis, prescribing or clinical approval.</p>
        </div>
      </div>
    </section>
  );
}
