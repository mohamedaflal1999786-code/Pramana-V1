"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Mail, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { resendVerificationAction } from "@/lib/auth/actions";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const errorParam = searchParams.get("error");

  const [email] = React.useState(emailParam);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [isResending, setIsResending] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(
    errorParam === "token_invalid_or_expired"
      ? "Your verification link was invalid or has expired. Please request a new verification link below."
      : null
  );

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setIsResending(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const result = await resendVerificationAction(email);
      if (result.success) {
        setStatusMessage("Verification link sent! Please check your inbox and spam folder.");
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrorMessage(result.error || "Failed to resend verification email.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An error occurred.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6 text-center py-2">
      <div className="w-14 h-14 rounded-full bg-[#e5f1df] text-[#145a45] flex items-center justify-center mx-auto">
        <Mail className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0">
          Check Your Institutional Inbox
        </h3>
        <p className="text-[14px] text-[var(--muted)] leading-relaxed max-w-sm mx-auto">
          We have dispatched a cryptographic confirmation link to{" "}
          <strong className="text-[var(--ink)]">{email || "your registered email"}</strong>.
          Click the link in that email to activate your account.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 text-[13px] text-[#145a45] bg-[#e5f1df] border border-[#c3d8c8] rounded-[7px] flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 text-[13px] text-[#b91c1c] bg-[#fdf2f2] border border-[#f5c6c6] rounded-[7px] flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)] text-left text-[13px] space-y-2">
        <div className="font-[650] text-[var(--ink)]">Verification Checklist:</div>
        <ul className="list-disc list-inside text-[var(--muted)] space-y-1 pl-1">
          <li>Check your spam / junk folder if the email does not arrive within 2 minutes.</li>
          <li>Verification links expire after 24 hours for institutional security.</li>
          <li>Ensure you open the link on an authorized clinical device.</li>
        </ul>
      </div>

      <div className="space-y-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResend}
          isLoading={isResending}
          disabled={resendCooldown > 0}
          leftIcon={<RefreshCw className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`} />}
        >
          {resendCooldown > 0
            ? `Resend Available in ${resendCooldown}s`
            : "Resend Verification Link →"}
        </Button>

        <Link href="/auth/signin">
          <Button variant="ghost" className="w-full text-[13px]">
            ← Return to Institutional Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      eyebrow="Security Step"
      title="Verify Institutional Email"
      subtitle="Complete your email verification before accessing patient safety workspaces."
      footerLinks={
        <p className="my-0">
          Need assistance?{" "}
          <Link href="/contact" className="text-[var(--green)] font-[650] hover:underline">
            Contact Safety Officer
          </Link>
        </p>
      }
    >
      <React.Suspense fallback={<div className="p-8 text-center text-[13px] text-[var(--muted)]">Loading verification status...</div>}>
        <VerifyEmailContent />
      </React.Suspense>
    </AuthLayout>
  );
}
