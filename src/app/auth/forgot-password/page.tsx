"use client";

import * as React from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { requestPasswordResetAction } from "@/lib/auth/actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Please enter a valid institutional email address.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await requestPasswordResetAction(email);
      if (!result.success) {
        setError(result.error || "Failed to process password recovery request.");
        setIsLoading(false);
        return;
      }
      setIsSent(true);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
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
            <Link href="/auth/signin">
              <Button variant="primary" className="w-full">
                Return to Institutional Sign In →
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
        {error && (
          <div className="p-3 text-[13px] text-[#b91c1c] bg-[#fdf2f2] border border-[#f5c6c6] rounded-[7px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
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

        <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
          Send Recovery Link →
        </Button>
      </form>
    </AuthLayout>
  );
}
