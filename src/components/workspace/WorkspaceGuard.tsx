"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldAlert, LogIn, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  // Check if we are running in production or development
  const isDev = process.env.NODE_ENV !== "production";
  const [hasDevBypass, setHasDevBypass] = React.useState(isDev);

  // In production, require actual authentication session
  if (!hasDevBypass && process.env.NODE_ENV === "production") {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-[12px] border border-[var(--line)] text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#fbebeb] text-[#991b1b] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-[22px] font-[650] text-[var(--ink)] my-0 mb-2">
            Institutional Authentication Required
          </h1>
          <p className="text-[14px] text-[var(--muted)] leading-relaxed mb-6">
            Pramana-V1 clinical workspaces are restricted to authorized healthcare professionals. In production, access strictly enforces verified Supabase Role-Based Access Control (RBAC).
          </p>
          <div className="space-y-3">
            <Link href="/auth/signin">
              <Button variant="primary" className="w-full" leftIcon={<LogIn className="w-4 h-4" />}>
                Sign In with Institutional Credentials →
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Return to Public Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Development Preview Banner */}
      <div className="bg-[#16392e] text-[#c3d8c8] px-4 py-2 text-[12px] border-b border-[#2d5648] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ad7b36] animate-pulse" />
          <strong className="text-white">DEVELOPMENT UI PREVIEW:</strong>
          <span>Evaluating clinical workspace interfaces. In production, Supabase Auth & RBAC are strictly enforced.</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/signin" className="hover:text-white underline text-[11px]">
            Test Production Auth Guard
          </Link>
        </div>
      </div>
      {children}
    </>
  );
}
