"use client";

import * as React from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 800);
  };

  if (isSent) {
    return (
      <AuthLayout
        eyebrow="Recovery Initiated"
        title="Check Your Inbox"
        subtitle={`Password reset instructions have been dispatched to ${email}.`}
      >
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-[#e5f1df] text-[#145a45] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-[14px] text-[var(--muted)] leading-relaxed mb-6">
            If an authorized account is associated with this email, you will receive a secure cryptographic reset link valid for 15 minutes.
          </p>
          <div className="space-y-3">
            <Link href="/auth/reset-password">
              <Button variant="primary" className="w-full">
                Enter Reset Token / Update Password →
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full">
                Return to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Account Recovery"
      title="Reset Your Password"
      subtitle="Enter your institutional email address and we'll dispatch secure reset credentials."
      footerLinks={
        <Link href="/auth/signin" className="inline-flex items-center gap-1.5 text-[var(--green)] font-[650] hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Institutional Email"
          type="email"
          placeholder="reviewer@hospital.org"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
          Send Recovery Link →
        </Button>
      </form>
    </AuthLayout>
  );
}
