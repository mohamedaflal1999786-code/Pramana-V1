import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="w-full flex flex-col md:flex-row justify-between gap-8 pb-8 mb-6 border-b border-[var(--line)]">
          <div className="max-w-sm">
            <strong className="text-[15px] text-[var(--ink)] block mb-1">
              Pramana-V1 · Unknown GenZ
            </strong>
            <p className="text-[13px] text-[var(--muted)] my-0 leading-relaxed">
              Evidence-driven healthcare intelligence and patient safety research platform. Every alert backed by verified clinical evidence.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-6 text-[13px]">
            <div>
              <span className="block font-[750] text-[11px] tracking-[1.4px] text-[var(--green)] uppercase mb-3">
                Platform
              </span>
              <ul className="space-y-2 list-none p-0 m-0">
                <li><Link href="/platform" className="hover:text-[var(--ink)]">Platform Overview</Link></li>
                <li><Link href="/how-it-works" className="hover:text-[var(--ink)]">How it Works</Link></li>
                <li><Link href="/responsible-ai" className="hover:text-[var(--ink)]">Responsible AI</Link></li>
                <li><Link href="/security-privacy" className="hover:text-[var(--ink)]">Security & Privacy</Link></li>
              </ul>
            </div>

            <div>
              <span className="block font-[750] text-[11px] tracking-[1.4px] text-[var(--green)] uppercase mb-3">
                Governance
              </span>
              <ul className="space-y-2 list-none p-0 m-0">
                <li><Link href="/about" className="hover:text-[var(--ink)]">About Unknown GenZ</Link></li>
                <li><Link href="/contact" className="hover:text-[var(--ink)]">Institutional Contact</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-[var(--ink)]">Privacy Policy</Link></li>
                <li><Link href="/terms-of-use" className="hover:text-[var(--ink)]">Terms of Use</Link></li>
              </ul>
            </div>

            <div>
              <span className="block font-[750] text-[11px] tracking-[1.4px] text-[var(--green)] uppercase mb-3">
                Access
              </span>
              <ul className="space-y-2 list-none p-0 m-0">
                <li><Link href="/auth/signin" className="hover:text-[var(--ink)]">Sign In</Link></li>
                <li><Link href="/auth/signup" className="hover:text-[var(--ink)]">Create Account</Link></li>
                <li><Link href="/auth/mfa" className="hover:text-[var(--ink)]">MFA Verification</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="w-full flex justify-between gap-5 flex-wrap items-center">
          <span>&copy; {new Date().getFullYear()} Pramana-V1 · Unknown GenZ. Research-stage software designed for human oversight.</span>
          <a href="#home">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
