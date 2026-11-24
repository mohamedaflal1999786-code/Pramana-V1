export default function Footer() {
  return (
    <footer className="border-t border-[var(--line)] py-[35px] text-[13px] text-[var(--muted)]">
      <div className="wrap flex justify-between gap-5 flex-wrap items-center">
        <strong className="font-semibold text-[var(--ink)]">
          Pramana-V1 · Unknown GenZ
        </strong>
        <span>Every alert. Backed by evidence.</span>
        <a href="#home" className="hover:text-[var(--ink)] transition-colors">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
