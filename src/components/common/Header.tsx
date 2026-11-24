"use client";

import { useState } from "react";
import type { NavItem } from "@/types";

const NAV_LINKS: NavItem[] = [
  { label: "Platform", href: "#platform" },
  { label: "How it works", href: "#workflow" },
  { label: "Responsible AI", href: "#principles" },
  { label: "About", href: "#about" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#faf9f5f5] border-b border-[var(--line)] backdrop-blur-[12px]">
      <nav className="wrap min-h-[80px] max-md:min-h-[68px] flex items-center justify-between gap-6 relative">
        <a
          className="brand flex items-center gap-[10px] text-[25px] max-md:text-[22px] font-[750] tracking-[-1.4px] text-[var(--ink)]"
          href="#home"
        >
          <svg
            className="w-[34px] h-[34px]"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
          >
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
          <span className="text-[12px] tracking-normal text-[var(--muted)] font-normal">
            V1
          </span>
        </a>

        <button
          className="menu hidden max-md:block bg-transparent border border-[var(--line)] p-[9px] rounded-[5px] text-[var(--ink)] cursor-pointer text-sm font-semibold"
          aria-expanded={isMenuOpen}
          aria-controls="navlinks"
          onClick={toggleMenu}
        >
          Menu
        </button>

        <div
          id="navlinks"
          className={`links flex gap-[28px] text-[14px] ${
            isMenuOpen
              ? "max-md:flex max-md:flex-col max-md:absolute max-md:top-[68px] max-md:left-0 max-md:right-0 max-md:bg-[var(--paper)] max-md:p-6 max-md:border-b max-md:border-[var(--line)] max-md:shadow-sm"
              : "max-md:hidden"
          }`}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="text-[var(--ink)] hover:text-[var(--green)] transition-colors py-1 max-md:py-2"
            >
              {link.label}
            </a>
          ))}
        </div>

        <a className="btn max-md:hidden" href="#platform">
          Explore platform ↗
        </a>
      </nav>
    </header>
  );
}
