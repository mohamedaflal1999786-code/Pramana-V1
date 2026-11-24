import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, CheckCircle2 } from "lucide-react";

export interface AuthLayoutProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  eyebrow?: string;
  children: React.ReactNode;
  footerLinks?: React.ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  eyebrow,
  children,
  footerLinks,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] bg-[var(--paper)]">
      {/* Brand Left Column (Desktop) */}
      <div className="bg-[#16392e] text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative grid lines */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #16392e 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Top Header Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-[10px] text-[24px] font-[750] tracking-[-1.4px] text-white">
            <svg className="w-[32px] h-[32px]" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path d="M20 3 35 10v11c0 8-7 13-15 16C12 34 5 29 5 21V10Z" stroke="#85b397" strokeWidth="2.5" />
              <path d="m12 20 6 6 11-13" stroke="#85b397" strokeWidth="3" strokeLinecap="round" />
            </svg>
            pramana
            <span className="text-[12px] tracking-normal text-[#b6d0bd] font-normal">V1</span>
          </Link>
        </div>

        {/* Center Illustration & Message */}
        <div className="my-12 relative z-10 max-w-lg">
          <div className="eyebrow text-[#c3d8c8] mb-3">Healthcare Intelligence & Patient Safety</div>
          <h1 className="text-[clamp(32px,3.8vw,46px)] leading-[1.08] font-[650] text-white my-0 mb-4 tracking-[-0.04em]">
            Every decision deserves <em className="font-serif font-normal italic text-[#a3cbaf]">evidence.</em>
          </h1>
          <p className="text-[16px] text-[#c3d8c8] leading-relaxed mb-8">
            Access institutional safety provenance graphs, cross-record discrepancy detection, and traceable clinical review.
          </p>

          <div className="space-y-3 pt-6 border-t border-[#779185]/50 text-[13px] text-[#b6d0bd]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-[#85b397] shrink-0" />
              <span>Design Goal: Human-in-the-loop oversight & professional review</span>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-[#85b397] shrink-0" />
              <span>Target Architecture: Zero foundation model training on clinical records</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#85b397] shrink-0" />
              <span>Intended Specification: Cryptographic document provenance tracking</span>
            </div>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="relative z-10 text-[12px] text-[#b6d0bd] flex items-center justify-between">
          <span>Unknown GenZ · Research Platform</span>
          <Link href="/security-privacy" className="hover:underline">
            Security & Privacy Specifications
          </Link>
        </div>
      </div>

      {/* Form Right Column */}
      <div className="p-6 sm:p-12 lg:p-16 flex flex-col justify-center items-center">
        <div className="w-full max-w-md">
          {/* Mobile Top Brand Bar */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-[10px] text-[22px] font-[750] tracking-[-1.4px] text-[var(--ink)]">
              <svg className="w-[28px] h-[28px]" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <path d="M20 3 35 10v11c0 8-7 13-15 16C12 34 5 29 5 21V10Z" stroke="#145a45" strokeWidth="2.5" />
                <path d="m12 20 6 6 11-13" stroke="#145a45" strokeWidth="3" strokeLinecap="round" />
              </svg>
              pramana
              <span className="text-[11px] tracking-normal text-[var(--muted)]">V1</span>
            </Link>
          </div>

          <div className="mb-8">
            {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
            <h2 className="text-[28px] font-[650] text-[var(--ink)] my-0 mb-2 tracking-[-0.03em]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[14px] text-[var(--muted)] my-0 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Content */}
          <div className="bg-white p-8 rounded-[12px] border border-[var(--line)] shadow-sm">
            {children}
          </div>

          {/* Footer Navigation */}
          {footerLinks && <div className="mt-6 text-center text-[13px] text-[var(--muted)]">{footerLinks}</div>}

          <div className="mt-8 text-center text-[12px] text-[var(--muted)]">
            <Link href="/" className="hover:text-[var(--ink)] transition-colors">
              ← Return to public homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
