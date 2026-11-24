"use client";

import * as React from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Mail, CheckCircle2 } from "lucide-react";

export default function VerifyEmailPage() {
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [verificationCode, setVerificationCode] = React.useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isVerified, setIsVerified] = React.useState(false);

  const handleInputChange = (idx: number, val: string) => {
    if (val.length > 1) val = val[0];
    const newCode = [...verificationCode];
    newCode[idx] = val;
    setVerificationCode(newCode);

    if (val && idx < 5) {
      const nextInput = document.getElementById(`digit-${idx + 1}`);
      nextInput?.focus();
    }
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
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
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 900);
  };

  if (isVerified) {
    return (
      <AuthLayout
        eyebrow="Verification Confirmed"
        title="Email Verified"
        subtitle="Your institutional email has been cryptographically confirmed."
      >
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-[#e5f1df] text-[#145a45] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-[14px] text-[var(--muted)] leading-relaxed mb-6">
            Your verification attestation has been dispatched. Next, set up Multi-Factor Authentication (MFA) to complete clinical security enrollment.
          </p>
          <Link href="/auth/mfa">
            <Button variant="primary" className="w-full">
              Proceed to MFA Enrollment →
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Security Step"
      title="Verify Institutional Email"
      subtitle="Enter the 6-digit verification code sent to your registered clinical email."
      footerLinks={
        <p className="my-0">
          Need assistance?{" "}
          <Link href="/contact" className="text-[var(--green)] font-[650] hover:underline">
            Contact Support
          </Link>
        </p>
      }
    >
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-center gap-2 sm:gap-3">
          {verificationCode.map((digit, idx) => (
            <input
              key={idx}
              id={`digit-${idx}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(idx, e.target.value)}
              className="w-10 h-12 sm:w-12 sm:h-14 text-center text-[20px] font-[750] border border-[var(--line)] rounded-[7px] bg-[#faf9f5] focus:border-[var(--green)] focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
            />
          ))}
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-[13px] text-[var(--green)] font-[650] hover:underline disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend verification code"}
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={isVerifying}
          disabled={verificationCode.some((d) => !d)}
        >
          Confirm Email Verification →
        </Button>
      </form>
    </AuthLayout>
  );
}
