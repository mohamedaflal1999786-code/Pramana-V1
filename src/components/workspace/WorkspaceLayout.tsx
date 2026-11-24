"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WorkspaceGuard } from "./WorkspaceGuard";
import {
  Stethoscope,
  Pill,
  User,
  ShieldCheck,
  FileText,
  Network,
  AlertTriangle,
  ArrowRightLeft,
  Languages,
  CheckSquare,
  LogOut,
  ChevronDown,
  Layers,
  Bell,
  Menu,
  X,
} from "lucide-react";

export interface WorkspaceLayoutProps {
  children: React.ReactNode;
  activeRole?: "doctor" | "pharmacist" | "patient" | "admin";
  pageTitle?: string;
}

export function WorkspaceLayout({
  children,
  activeRole = "doctor",
  pageTitle,
}: WorkspaceLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const roleLinks = [
    { label: "Doctor", href: "/workspaces/doctor", icon: <Stethoscope className="w-4 h-4" /> },
    { label: "Pharmacist", href: "/workspaces/pharmacist", icon: <Pill className="w-4 h-4" /> },
    { label: "Patient", href: "/workspaces/patient", icon: <User className="w-4 h-4" /> },
    { label: "Admin", href: "/workspaces/admin", icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const clinicalModules = [
    { label: "Document Intelligence", href: "/workspaces/documents", icon: <FileText className="w-4 h-4" /> },
    { label: "Safety Provenance Graph", href: "/workspaces/graph", icon: <Network className="w-4 h-4" /> },
    { label: "Medication Safety", href: "/workspaces/medications", icon: <Pill className="w-4 h-4" /> },
    { label: "Clinical Handoffs", href: "/workspaces/handoffs", icon: <ArrowRightLeft className="w-4 h-4" /> },
    { label: "Safety Alert Centre", href: "/workspaces/alerts", icon: <AlertTriangle className="w-4 h-4" />, badge: "0" },
    { label: "Multilingual Discharge", href: "/workspaces/discharge", icon: <Languages className="w-4 h-4" /> },
    { label: "Professional Review", href: "/workspaces/review", icon: <CheckSquare className="w-4 h-4" /> },
  ];

  return (
    <WorkspaceGuard>
      <div className="min-h-screen bg-[var(--paper)] flex flex-col text-[var(--ink)]">
        {/* Workspace Top Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-[var(--line)]">
          <div className="px-4 sm:px-8 min-h-[64px] flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded text-[var(--muted)] hover:text-[var(--ink)]"
                aria-label="Toggle workspace navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link href="/" className="flex items-center gap-2.5 text-[20px] font-[750] tracking-[-1px] text-[var(--ink)]">
                <svg className="w-[28px] h-[28px]" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <path d="M20 3 35 10v11c0 8-7 13-15 16C12 34 5 29 5 21V10Z" stroke="#145a45" strokeWidth="2.5" />
                  <path d="m12 20 6 6 11-13" stroke="#145a45" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span>pramana</span>
                <span className="text-[11px] font-normal text-[var(--muted)]">WORKSPACE</span>
              </Link>
            </div>

            {/* Role Switcher Tabs (Desktop) */}
            <div className="hidden md:flex items-center gap-1 bg-[#faf9f5] p-1 rounded-[8px] border border-[var(--line)]">
              {roleLinks.map((role) => {
                const isActive = pathname.startsWith(role.href);
                return (
                  <Link
                    key={role.href}
                    href={role.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[12px] font-[650] transition-colors",
                      isActive
                        ? "bg-[var(--green)] text-white shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    )}
                  >
                    {role.icon}
                    <span>{role.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <span className="block text-[13px] font-[650] text-[var(--ink)]">Dr. Eleanor Vance</span>
                <span className="block text-[11px] text-[var(--muted)] capitalize">{activeRole} Reviewer</span>
              </div>
              <Link
                href="/auth/signin"
                className="p-2 rounded-[6px] text-[var(--muted)] hover:text-[#991b1b] hover:bg-[#fdf2f2] transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Body with Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar (Desktop) */}
          <aside className="w-64 bg-[#faf9f5] border-r border-[var(--line)] p-4 hidden lg:flex flex-col justify-between shrink-0 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <span className="block text-[11px] font-[750] tracking-[1.4px] text-[var(--muted)] uppercase mb-2 px-3">
                  Role Workspaces
                </span>
                <nav className="space-y-1">
                  {roleLinks.map((r) => {
                    const isActive = pathname === r.href;
                    return (
                      <Link
                        key={r.href}
                        href={r.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-[7px] text-[13px] font-[650] transition-colors",
                          isActive
                            ? "bg-[var(--green)] text-white"
                            : "text-[var(--ink)] hover:bg-[#e9eee6]"
                        )}
                      >
                        {r.icon}
                        <span>{r.label} Workspace</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div>
                <span className="block text-[11px] font-[750] tracking-[1.4px] text-[var(--muted)] uppercase mb-2 px-3">
                  Safety Modules
                </span>
                <nav className="space-y-1">
                  {clinicalModules.map((m) => {
                    const isActive = pathname === m.href;
                    return (
                      <Link
                        key={m.href}
                        href={m.href}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-[7px] text-[13px] font-[650] transition-colors",
                          isActive
                            ? "bg-[var(--green)] text-white"
                            : "text-[var(--ink)] hover:bg-[#e9eee6]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {m.icon}
                          <span>{m.label}</span>
                        </div>
                        {m.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#e6ede2] text-[var(--green)] font-bold">
                            {m.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--line)] text-[11px] text-[var(--muted)]">
              <p className="my-0">Pramana-V1 Healthcare Intelligence</p>
              <p className="my-0 mt-0.5">Unknown GenZ Research</p>
            </div>
          </aside>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-[#172b25]/50 backdrop-blur-sm flex">
              <div className="w-72 bg-white h-full p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
                    <span className="font-[750] text-[16px]">Navigation</span>
                    <button onClick={() => setMobileMenuOpen(false)}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] font-[750] tracking-[1.2px] text-[var(--muted)] uppercase block mb-2">
                      Workspaces
                    </span>
                    <div className="space-y-1">
                      {roleLinks.map((r) => (
                        <Link
                          key={r.href}
                          href={r.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-[6px] text-[13px] font-[650] hover:bg-[#faf9f5]"
                        >
                          {r.icon}
                          <span>{r.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-[750] tracking-[1.2px] text-[var(--muted)] uppercase block mb-2">
                      Clinical Modules
                    </span>
                    <div className="space-y-1">
                      {clinicalModules.map((m) => (
                        <Link
                          key={m.href}
                          href={m.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-[6px] text-[13px] font-[650] hover:bg-[#faf9f5]"
                        >
                          {m.icon}
                          <span>{m.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--line)]">
                  <Link href="/" className="text-[13px] text-[var(--green)] font-[650]">
                    ← Back to Homepage
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Workspace Panel */}
          <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </WorkspaceGuard>
  );
}
