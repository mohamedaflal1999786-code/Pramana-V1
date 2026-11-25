"use client";

import * as React from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Lock, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { updatePasswordAction } from "@/lib/auth/actions";

export default function ResetPasswordPage() {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
      const result = await updatePasswordAction(password);
      if (!result.success) {
        setError(result.error || "Failed to update password.");
        setIsLoading(false);
        return;
      }
      setIsSuccess(true);
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
