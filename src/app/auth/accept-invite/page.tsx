"use client";

import * as React from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Building2, UserCheck, Lock } from "lucide-react";

export default function AcceptInvitePage() {
  const [fullName, setFullName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8 || password !== confirmPassword) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = "/auth/mfa";
    }, 800);
  };

  return (
    <AuthLayout
      eyebrow="Institutional Invitation"
      title="Join Clinical Workspace"
      subtitle="You have been invited by Department Safety Quality Oversight to collaborate on Pramana-V1."
    >
      <div className="p-3 bg-[#e6ede2] rounded-[8px] border border-[var(--line)] mb-6 flex items-center gap-3 text-[13px]">
        <Building2 className="w-5 h-5 text-[var(--green)] shrink-0" />
        <div>
          <strong className="text-[var(--ink)] block">Assigned Role: Clinical Reviewer</strong>
          <span className="text-[var(--muted)]">Institutional Tenant: Department of Critical Care</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Your Full Legal Name"
          placeholder="Dr. Samuel Chen"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <Input
          label="Set Account Password"
          type="password"
          isPassword
          placeholder="••••••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Minimum 8 characters."
          required
        />

        <Input
          label="Confirm Password"
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
            Accept Invitation & Setup MFA →
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
