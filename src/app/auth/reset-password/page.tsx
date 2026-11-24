"use client";

import * as React from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 800);
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
          <div className="p-3 text-[13px] text-[#b91c1c] bg-[#fdf2f2] border border-[#f5c6c6] rounded-[7px]">
            {error}
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
          helperText="Must be at least 8 characters and include uppercase, lowercase, and numbers."
          required
        />

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
