"use client";

import * as React from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { User, Mail, Lock, Building2 } from "lucide-react";

function SignUpForm() {
  const { toast } = useToast();
  const [formData, setFormData] = React.useState({
    fullName: "",
    email: "",
    institution: "",
    role: "Clinical Reviewer",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!formData.email.includes("@")) {
      setError("Please provide a valid institutional email address.");
      return;
    }
    if (!formData.institution.trim()) {
      setError("Please specify your health system or research institution.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!formData.agreeTerms) {
      setError("You must acknowledge the research license and terms of use.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = "/auth/pending-approval";
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
        label="Full Professional Name"
        placeholder="Dr. Eleanor Vance"
        leftIcon={<User className="w-4 h-4" />}
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        required
      />

      <Input
        label="Institutional Email"
        type="email"
        placeholder="e.vance@medicalcenter.org"
        leftIcon={<Mail className="w-4 h-4" />}
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        helperText="Personal emails (@gmail, @yahoo) are not permitted for clinical access."
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Health System / Institution"
          placeholder="Mayo Clinic / Lab"
          leftIcon={<Building2 className="w-4 h-4" />}
          value={formData.institution}
          onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
          required
        />
        <Select
          label="Clinical Role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          options={[
            { value: "Clinical Reviewer", label: "Clinical Reviewer (Physician / Nurse)" },
            { value: "Pharmacist", label: "Clinical Pharmacist" },
            { value: "Safety Officer", label: "Patient Safety & Quality Officer" },
            { value: "Informatics Researcher", label: "Informatics Researcher" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Password"
          type="password"
          isPassword
          placeholder="••••••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          isPassword
          placeholder="••••••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
        />
      </div>

      <div className="pt-1">
        <label className="flex items-start gap-2 cursor-pointer text-[12px] text-[var(--muted)] leading-relaxed">
          <input
            type="checkbox"
            checked={formData.agreeTerms}
            onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
            className="mt-0.5 rounded border-[var(--line)] text-[var(--green)] focus:ring-[var(--green)]"
          />
          <span>
            I acknowledge that Pramana-V1 is research-stage assistive software and agree to the{" "}
            <Link href="/terms-of-use" target="_blank" className="text-[var(--green)] underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" target="_blank" className="text-[var(--green)] underline">
              Privacy Policy
            </Link>.
          </span>
        </label>
      </div>

      <div className="pt-2">
        <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
          Submit for Institutional Approval →
        </Button>
      </div>
    </form>
  );
}

export default function SignUpPage() {
  return (
    <ToastProvider>
      <AuthLayout
        eyebrow="Institutional Onboarding"
        title="Create Research Account"
        subtitle="Register your credentials to review provenance graphs and participate in safety audits."
        footerLinks={
          <p className="my-0">
            Already have an approved account?{" "}
            <Link href="/auth/signin" className="text-[var(--green)] font-[650] hover:underline">
              Sign in
            </Link>
          </p>
        }
      >
        <SignUpForm />
      </AuthLayout>
    </ToastProvider>
  );
}
