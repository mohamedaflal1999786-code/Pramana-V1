"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WorkspaceGuard } from "./WorkspaceGuard";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { signOutAction } from "@/lib/auth/actions";
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
  Menu,
  X,
  Key,
  Shield,
  Building,
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
  const [profileModalOpen, setProfileModalOpen] = React.useState(false);

  // Authenticated user state
  const [userProfile, setUserProfile] = React.useState<{
    fullName: string;
    email: string;
    role: string;
    institution: string;
  }>({
    fullName: "Dr. Eleanor Vance",
    email: "reviewer@hospital.org",
    role: activeRole,
    institution: "Pramana Academic Health System",
  });

  React.useEffect(() => {
    async function loadUser() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const metaName = user.user_metadata?.full_name;
        const metaInst = user.user_metadata?.institution;
        const metaRole = user.app_metadata?.role || user.user_metadata?.requested_role;

        setUserProfile({
          fullName: metaName || user.email?.split("@")[0] || "Attending Clinician",
          email: user.email || "clinician@hospital.org",
          role: metaRole || activeRole,
          institution: metaInst || "Pramana Academic Health System",
        });
      }
    }
    loadUser();
  }, [activeRole]);

  const handleSignOut = async () => {
    await signOutAction();
    window.location.href = "/auth/signin";
  };

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
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="text-right hidden sm:block p-1.5 rounded-[6px] hover:bg-[#faf9f5] transition-colors"
                title="View Account & Security Settings"
              >
                <span className="block text-[13px] font-[650] text-[var(--ink)]">{userProfile.fullName}</span>
                <span className="block text-[11px] text-[var(--muted)] capitalize">{userProfile.role} • Security Active</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="p-2 rounded-[6px] text-[var(--muted)] hover:text-[#991b1b] hover:bg-[#fdf2f2] transition-colors"
                title="Sign Out of Workspace"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Account & Security Modal */}
        {profileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="max-w-md w-full bg-white rounded-[12px] border border-[var(--line)] p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[var(--green)]" />
                  <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">
                    Account & Security Settings
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="p-1 text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-[13px]">
                <div className="p-3 bg-[#faf9f5] rounded-[8px] border border-[var(--line)] space-y-1.5">
                  <div className="text-[11px] font-bold text-[var(--muted)] uppercase">User Profile</div>
                  <div className="font-[650] text-[var(--ink)] text-[15px]">{userProfile.fullName}</div>
                  <div className="text-[var(--muted)]">{userProfile.email}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#faf9f5] rounded-[8px] border border-[var(--line)]">
                    <div className="text-[11px] font-bold text-[var(--muted)] uppercase">Assigned Role</div>
                    <div className="font-[650] text-[var(--green)] capitalize">{userProfile.role}</div>
                  </div>
                  <div className="p-3 bg-[#faf9f5] rounded-[8px] border border-[var(--line)]">
                    <div className="text-[11px] font-bold text-[var(--muted)] uppercase">Institution</div>
                    <div className="font-[650] text-[var(--ink)] truncate">{userProfile.institution}</div>
                  </div>
                </div>

                <div className="p-3 bg-[#e5f1df] rounded-[8px] border border-[#c3d8c8] text-[#145a45] space-y-1">
                  <div className="font-[650] flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    <span>Row Level Security (RLS) Active</span>
                  </div>
                  <p className="text-[11px] text-[#2d5648] my-0 leading-relaxed">
                    Database queries are strictly segregated to your authorized organization tenant.
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <Link
                    href="/auth/mfa"
                    className="flex items-center justify-between p-2.5 rounded-[6px] border border-[var(--line)] hover:bg-[#faf9f5] transition-colors"
                  >
                    <span className="font-[650] text-[var(--ink)]">Configure Multi-Factor Authentication (TOTP)</span>
                    <span className="text-[11px] text-[var(--green)] font-bold">Manage →</span>
                  </Link>

                  <Link
                    href="/auth/reset-password"
                    className="flex items-center justify-between p-2.5 rounded-[6px] border border-[var(--line)] hover:bg-[#faf9f5] transition-colors"
                  >
                    <span className="font-[650] text-[var(--ink)]">Change Password</span>
                    <span className="text-[11px] text-[var(--green)] font-bold">Update →</span>
                  </Link>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--line)] flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-[13px] text-[#991b1b] hover:underline font-[650] flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-1.5 bg-[#145a45] text-white rounded-[6px] text-[13px] font-[650]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

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

            <div className="p-3 bg-white rounded-[8px] border border-[var(--line)] text-[12px] space-y-1">
              <div className="flex items-center gap-1.5 text-[var(--green)] font-[650]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Pramana Safety Graph</span>
              </div>
              <p className="text-[var(--muted)] my-0 text-[11px] leading-tight">
                Deterministic provenance active. Every alert verified.
              </p>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white">
            <div className="max-w-7xl mx-auto space-y-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </WorkspaceGuard>
  );
}
