"use client";

import * as React from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Lock, Clock } from "lucide-react";

export default function SessionExpiredPage() {
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleReauth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = "/platform";
    }, 800);
  };

  return (
    <AuthLayout
      eyebrow="Clinical Security Policy"
      title="Session Expired"
      subtitle="For patient data confidentiality, inactive clinical sessions are automatically locked."
    >
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-[#fbf4e8] text-[#8c591c] flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <p className="text-[13px] text-[var(--muted)] my-0">
          Re-enter your password to decrypt your active workspace and resume evidence review.
        </p>
      </div>

      <form onSubmit={handleReauth} className="space-y-4">
        <Input
          label="Confirm Password"
          type="password"
          isPassword
          placeholder="••••••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
          Unlock Workspace →
        </Button>

        <div className="pt-2 text-center">
          <Link href="/auth/signin" className="text-[12px] text-[var(--muted)] hover:text-[var(--ink)] underline">
            Sign out and log in with different credentials
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
