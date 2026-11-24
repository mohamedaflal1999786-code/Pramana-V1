"use client";

import * as React from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Mail, Lock } from "lucide-react";

function SignInForm() {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.includes("@")) {
      setError("Please enter a valid institutional email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    // Prepared for Supabase Auth in Phase 02+
    setTimeout(() => {
      setIsLoading(false);
      toast({
        type: "info",
        title: "Supabase Authentication Ready",
        description: "Institutional sign-in is prepared for Supabase credentials.",
      });
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-[13px] text-[#b91c1c] bg-[#fdf2f2] border border-[#f5c6c6] rounded-[7px]">
          {error}
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
    <ToastProvider>
      <AuthLayout
        eyebrow="Clinical Portal"
        title="Sign In to Pramana-V1"
        subtitle="Access your authorized institution's clinical document intelligence workspace."
        footerLinks={
          <p className="my-0">
            Don&apos;t have an institutional account?{" "}
            <Link href="/auth/signup" className="text-[var(--green)] font-[650] hover:underline">
              Create an account
            </Link>
          </p>
        }
      >
        <SignInForm />
      </AuthLayout>
    </ToastProvider>
  );
}
