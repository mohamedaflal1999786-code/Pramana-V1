"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: "Platform", href: "/platform" },
    { label: "How it works", href: "/how-it-works" },
    { label: "Responsible AI", href: "/responsible-ai" },
    { label: "Security", href: "/security-privacy" },
    { label: "About", href: "/about" },
  ];

  return (
    <header>
      <nav className="wrap">
        <Link className="brand" href="/">
          <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path
              d="M20 3 35 10v11c0 8-7 13-15 16C12 34 5 29 5 21V10Z"
              stroke="#145a45"
              strokeWidth="2.5"
            />
            <path
              d="m12 20 6 6 11-13"
              stroke="#145a45"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          pramana
          <span style={{ fontSize: "12px", letterSpacing: "0", color: "#53665d" }}>
            V1
          </span>
        </Link>

        <button
          className="menu"
          aria-expanded={isOpen}
          aria-controls="navlinks"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          Menu
        </button>

        <div className={`links ${isOpen ? "open" : ""}`} id="navlinks">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={pathname === link.href ? "text-[var(--green)] font-[650]" : ""}
            >
              {link.label}
            </Link>
          ))}
          <div className="md:hidden pt-4 mt-2 border-t border-[var(--line)] flex flex-col gap-3">
            <Link
              href="/auth/signin"
              onClick={() => setIsOpen(false)}
              className="text-[14px] font-[650] text-[var(--ink)]"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              onClick={() => setIsOpen(false)}
              className="btn text-center justify-center"
            >
              Get started ↗
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 max-md:hidden">
          <Link
            href="/auth/signin"
            className="text-[14px] font-[650] text-[var(--ink)] hover:text-[var(--green)] transition-colors py-2 px-1"
          >
            Sign in
          </Link>
          <Link className="btn" href="/auth/signup">
            Get started ↗
          </Link>
        </div>
      </nav>
    </header>
  );
}
