"use client";

import * as React from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Lock, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { updatePasswordAction } from "@/lib/auth/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tokens, setTokens] = React.useState<{ access_token: string; refresh_token?: string } | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Extract tokens from URL hash fragment (sent by Supabase recovery redirect)
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
      const access = hashParams.get("access_token");
      const refresh = hashParams.get("refresh_token") || undefined;
      if (access) {
        setTokens({ access_token: access, refresh_token: refresh });
        const supabase = getSupabaseBrowserClient();
        if (supabase && refresh) {
          supabase.auth.setSession({ access_token: access, refresh_token: refresh }).catch(console.error);
        }
      }
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      if (code) {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          supabase.auth.exchangeCodeForSession(code).then(({ data }) => {
            if (data?.session) {
              setTokens({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
              });
            }
          }).catch(console.error);
        }
      }
    }
  }, []);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError("Please ensure your new password satisfies all entropy requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Resolve access token from state or directly from window hash
      let accessToken = tokens?.access_token;
      let refreshToken = tokens?.refresh_token;

      if (!accessToken && typeof window !== "undefined") {
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
          const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
          accessToken = hashParams.get("access_token") || undefined;
          refreshToken = hashParams.get("refresh_token") || undefined;
        }
      }

      // 2. Set browser session in cookies if possible
      const supabase = getSupabaseBrowserClient();
      if (supabase && accessToken && refreshToken) {
        try {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        } catch {
          // Continue to server action
        }
      }

      // 3. Update password via server action with verified accessToken
      const result = await updatePasswordAction(password, accessToken);
      if (result.success) {
        setIsSuccess(true);
        return;
      }

      // 4. Fallback to client-side direct update if server action couldn't find session
      if (supabase) {
        const { error: clientError } = await supabase.auth.updateUser({ password });
        if (!clientError) {
          setIsSuccess(true);
          return;
        }
      }

      setError(result.error || "Failed to update password.");
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        eyebrow="Credential Updated"
        title="Password Reset Successful"
        subtitle="Your credentials have been securely refreshed."
      >
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-[#e5f1df] text-[#145a45] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-[14px] text-[var(--muted)] leading-relaxed mb-6">
            You may now authenticate into your healthcare intelligence workspace with your new password.
          </p>
          <Link href="/auth/signin">
            <Button variant="primary" className="w-full">
              Proceed to Sign In →
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Security Update"
      title="Create New Password"
      subtitle="Ensure your new password satisfies institutional healthcare entropy requirements."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-[13px] text-[#b91c1c] bg-[#fdf2f2] border border-[#f5c6c6] rounded-[7px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="New Password"
          type="password"
          isPassword
          placeholder="••••••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Real-Time Password Complexity Indicator */}
        <div className="p-3 rounded-[6px] bg-[#faf9f5] border border-[var(--line)] text-[11px] space-y-1">
          <div className="font-[650] text-[var(--ink)] mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--green)]" />
            <span>Entropy Requirements:</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[var(--muted)]">
            <span className={passwordChecks.length ? "text-[#145a45] font-semibold" : ""}>
              {passwordChecks.length ? "✓" : "•"} At least 8 characters
            </span>
            <span className={passwordChecks.uppercase ? "text-[#145a45] font-semibold" : ""}>
              {passwordChecks.uppercase ? "✓" : "•"} Uppercase (A-Z)
            </span>
            <span className={passwordChecks.lowercase ? "text-[#145a45] font-semibold" : ""}>
              {passwordChecks.lowercase ? "✓" : "•"} Lowercase (a-z)
            </span>
            <span className={passwordChecks.number ? "text-[#145a45] font-semibold" : ""}>
              {passwordChecks.number ? "✓" : "•"} Number (0-9)
            </span>
            <span className={passwordChecks.special ? "text-[#145a45] font-semibold" : ""}>
              {passwordChecks.special ? "✓" : "•"} Special char (!@#$)
            </span>
          </div>
        </div>

        <Input
          label="Confirm New Password"
          type="password"
          isPassword
          placeholder="••••••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <div className="pt-2">
          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Update Password & Re-authenticate →
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
