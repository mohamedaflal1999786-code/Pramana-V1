"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { signInAction } from "@/lib/auth/actions";

function SignInForm() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "";
  const errorParam = searchParams.get("error");
  const verifiedParam = searchParams.get("verified");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    errorParam === "verification_expired"
      ? "Verification link has expired. Please sign in or request a new link."
      : null
  );
  const [needsVerification, setNeedsVerification] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);

    if (!email.includes("@")) {
      setError("Please enter a valid institutional email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      if (rememberMe) formData.set("rememberMe", "true");

      const result = await signInAction(formData, returnUrl);

      if (!result.success) {
        setError(result.error || "Failed to sign in. Please verify your credentials.");
        if (result.requiresEmailVerification) {
          setNeedsVerification(true);
        }
        setIsLoading(false);
        return;
      }

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during sign-in.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {verifiedParam && (
        <div className="p-3 text-[13px] text-[#145a45] bg-[#e5f1df] border border-[#c3d8c8] rounded-[7px] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Your email has been verified. You may now sign in.</span>
        </div>
      )}

      {error && (
        <div className="p-3 text-[13px] text-[#b91c1c] bg-[#fdf2f2] border border-[#f5c6c6] rounded-[7px] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{error}</span>
            {needsVerification && (
              <div className="mt-2">
                <Link
                  href={`/auth/verify-email?email=${encodeURIComponent(email)}`}
                  className="text-[12px] font-[650] underline text-[#991b1b] hover:text-[#7f1d1d]"
                >
                  Request a new verification email →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <Input
        label="Institutional Email"
        type="email"
        placeholder="reviewer@hospital.org"
        leftIcon={<Mail className="w-4 h-4" />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        label="Password"
        type="password"
        isPassword
        placeholder="••••••••••••"
        leftIcon={<Lock className="w-4 h-4" />}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <div className="flex items-center justify-between text-[13px] pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-[var(--muted)]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-[var(--line)] text-[var(--green)] focus:ring-[var(--green)]"
          />
          <span>Remember institutional device</span>
        </label>
        <Link
          href="/auth/forgot-password"
          className="text-[var(--green)] font-[650] hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <div className="pt-2">
        <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
          Sign In to Workspace →
        </Button>
      </div>
    </form>
  );
}

export default function SignInPage() {
  return (
    <AuthLayout
      eyebrow="Clinical Access"
      title="Institutional Sign In"
      subtitle="Authenticate with your hospital or research facility credentials to access safety intelligence."
      footerLinks={
        <p className="my-0">
          Need an institutional research account?{" "}
          <Link href="/auth/signup" className="text-[var(--green)] font-[650] hover:underline">
            Register Workspace Access
          </Link>
        </p>
      }
    >
      <React.Suspense fallback={<div className="p-8 text-center text-[13px] text-[var(--muted)]">Loading credentials interface...</div>}>
        <SignInForm />
      </React.Suspense>
    </AuthLayout>
  );
}
