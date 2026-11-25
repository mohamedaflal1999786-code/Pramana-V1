"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, LogIn, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setIsAuthenticated(false);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);

      // Check if user is pending
      const isActive = user.app_metadata?.is_active;
      if (isActive === false) {
        setIsPending(true);
      }
    }
    checkAuth();
  }, []);

  // During initial client-side hydration, render children
  if (isAuthenticated === null) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
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
            Pramana-V1 clinical workspaces are restricted to authorized healthcare professionals. Access strictly enforces verified Supabase Role-Based Access Control (RBAC).
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

  if (isPending) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-[12px] border border-[var(--line)] text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#fbf4e8] text-[#8c591c] flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-[22px] font-[650] text-[var(--ink)] my-0 mb-2">
            Account Pending Approval
          </h1>
          <p className="text-[14px] text-[var(--muted)] leading-relaxed mb-6">
            Your registration is currently pending review by your institutional administrator or safety officer.
          </p>
          <div className="space-y-3">
            <Link href="/auth/pending-approval">
              <Button variant="primary" className="w-full">
                View Approval Status →
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full">
                Sign In with Different Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
