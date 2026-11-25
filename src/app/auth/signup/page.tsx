"use client";

import * as React from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { User, Mail, Lock, Building2, AlertCircle, ShieldCheck } from "lucide-react";
import { signUpAction } from "@/lib/auth/actions";

export default function SignUpPage() {
  const [formData, setFormData] = React.useState({
    fullName: "",
    email: "",
    institution: "",
    role: "doctor",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Real-time password entropy indicators
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (!isPasswordValid) {
      setError("Please ensure your password fulfills all security requirements below.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!formData.agreeTerms) {
      setError("You must acknowledge the research license and healthcare terms of use.");
      return;
    }

    setIsLoading(true);

    try {
      const data = new FormData();
      data.set("fullName", formData.fullName);
      data.set("email", formData.email);
      data.set("institution", formData.institution);
      data.set("role", formData.role);
      data.set("password", formData.password);

      const result = await signUpAction(data);

      if (!result.success) {
        setError(result.error || "Failed to submit registration.");
        setIsLoading(false);
        return;
      }

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during registration.");
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Institutional Onboarding"
      title="Request Workspace Access"
      subtitle="Create a verified clinical research account. Professional credentials require institutional authorization."
      footerLinks={
        <p className="my-0">
          Already have an authorized account?{" "}
          <Link href="/auth/signin" className="text-[var(--green)] font-[650] hover:underline">
            Sign In to Workspace
          </Link>
        </p>
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
            label="Requested Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { label: "Attending Physician (Doctor)", value: "doctor" },
              { label: "Clinical Pharmacist", value: "pharmacist" },
              { label: "Patient / Representative", value: "patient" },
            ]}
          />
        </div>

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

        {/* Real-Time Password Complexity Indicator */}
        <div className="p-3 rounded-[6px] bg-[#faf9f5] border border-[var(--line)] text-[11px] space-y-1">
          <div className="font-[650] text-[var(--ink)] mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--green)]" />
            <span>Healthcare Security Entropy Requirements:</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[var(--muted)]">
            <span className={passwordChecks.length ? "text-[#145a45] font-semibold" : ""}>
              {passwordChecks.length ? "✓" : "•"} At least 8 characters
            </span>
            <span className={passwordChecks.uppercase ? "text-[#145a45] font-semibold" : ""}>
              {passwordChecks.uppercase ? "✓" : "•"} Uppercase letter (A-Z)
            </span>
            <span className={passwordChecks.lowercase ? "text-[#145a45] font-semibold" : ""}>
              {passwordChecks.lowercase ? "✓" : "•"} Lowercase letter (a-z)
            </span>
            <span className={passwordChecks.number ? "text-[#145a45] font-semibold" : ""}>
              {passwordChecks.number ? "✓" : "•"} Numerical digit (0-9)
            </span>
            <span className={passwordChecks.special ? "text-[#145a45] font-semibold" : ""}>
              {passwordChecks.special ? "✓" : "•"} Special character (!@#$)
            </span>
          </div>
        </div>

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

        <label className="flex items-start gap-2.5 cursor-pointer text-[12px] text-[var(--muted)] pt-1">
          <input
            type="checkbox"
            checked={formData.agreeTerms}
            onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
            className="mt-0.5 rounded border-[var(--line)] text-[var(--green)] focus:ring-[var(--green)]"
            required
          />
          <span>
            I acknowledge that Pramana-V1 is an investigational research platform. I agree to the{" "}
            <Link href="/terms-of-use" className="text-[var(--green)] underline font-[650]">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/responsible-ai" className="text-[var(--green)] underline font-[650]">
              Responsible AI Charter
            </Link>
            .
          </span>
        </label>

        <div className="pt-2">
          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Submit Institutional Registration →
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
