"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, QrCode, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import {
  enrollTotpFactorAction,
  verifyTotpFactorAction,
  listMfaFactorsAction,
} from "@/lib/auth/mfa";

function MfaForm() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/workspaces/doctor";

  const [mode, setMode] = React.useState<"verify" | "enroll">("verify");
  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Enrollment state
  const [enrollData, setEnrollData] = React.useState<{
    factorId?: string;
    qrCode?: string;
    secret?: string;
  } | null>(null);

  // Active factor ID for verification
  const [activeFactorId, setActiveFactorId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadFactors() {
      try {
        const res = await listMfaFactorsAction();
        if (res.factors && res.factors.length > 0) {
          setActiveFactorId(res.factors[0].id);
          setMode("verify");
        } else {
          // No factors yet, switch to enrollment
          setMode("enroll");
          await startEnrollment();
        }
      } catch {
        setMode("enroll");
      }
    }
    loadFactors();
  }, []);

  const startEnrollment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await enrollTotpFactorAction();
      if (!res.success) {
        setError(res.error || "Failed to initialize TOTP enrollment.");
      } else {
        setEnrollData({
          factorId: res.factorId,
          qrCode: res.qrCode,
          secret: res.secret,
        });
        setActiveFactorId(res.factorId || null);
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred during enrollment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (idx: number, val: string) => {
    if (val.length > 1) val = val[0];
    const newCode = [...code];
    newCode[idx] = val;
    setCode(newCode);

    if (val && idx < 5) {
      document.getElementById(`mfa-digit-${idx + 1}`)?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits of your authenticator code.");
      return;
    }

    if (!activeFactorId) {
      setError("No active TOTP factor found. Please reload the enrollment.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyTotpFactorAction(activeFactorId, fullCode, returnUrl);
      if (!result.success) {
        setError(result.error || "Verification failed. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccessMsg("Multi-factor authentication confirmed. Redirecting to workspace...");
      setTimeout(() => {
        window.location.href = result.redirectUrl || returnUrl;
      }, 700);
    } catch (err: any) {
      setError(err?.message || "Verification error.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-6">
      {error && (
        <div className="p-3 text-[13px] text-[#b91c1c] bg-[#fdf2f2] border border-[#f5c6c6] rounded-[7px] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 text-[13px] text-[#145a45] bg-[#e5f1df] border border-[#c3d8c8] rounded-[7px] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {mode === "enroll" && enrollData && (
        <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)] text-center space-y-3">
          <div className="text-[13px] font-[650] text-[var(--ink)] flex items-center justify-center gap-2">
            <QrCode className="w-4 h-4 text-[var(--green)]" />
            <span>Scan with your Authenticator App:</span>
          </div>

          {enrollData.qrCode ? (
            <div className="flex justify-center p-2 bg-white rounded border border-[var(--line)] max-w-[180px] mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enrollData.qrCode}
                alt="Authenticator QR Code"
                className="w-40 h-40"
              />
            </div>
          ) : (
            <div className="p-3 bg-white rounded text-[12px] font-mono break-all text-[var(--ink)] border border-[var(--line)]">
              {enrollData.secret}
            </div>
          )}

          {enrollData.secret && (
            <div className="text-[11px] text-[var(--muted)]">
              Manual secret key: <code className="font-mono font-bold text-[var(--ink)]">{enrollData.secret}</code>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-[13px] font-[650] text-[var(--ink)] text-center mb-3">
          {mode === "enroll"
            ? "Enter the 6-digit code shown in your authenticator app to complete setup:"
            : "Enter the 6-digit verification code generated by your authenticator app:"}
        </label>
        <div className="flex justify-center gap-2 sm:gap-3 mb-2">
          {code.map((digit, idx) => (
            <input
              key={idx}
              id={`mfa-digit-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(idx, e.target.value)}
              className="w-10 h-12 sm:w-12 sm:h-14 text-center text-[20px] font-[750] border border-[var(--line)] rounded-[7px] bg-[#faf9f5] focus:border-[var(--green)] focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
            />
          ))}
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isLoading}
        leftIcon={<ShieldCheck className="w-4 h-4" />}
      >
        {mode === "enroll" ? "Verify & Complete Enrollment →" : "Verify Authenticator Code →"}
      </Button>

      {mode === "verify" && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={startEnrollment}
            className="text-[12px] text-[var(--muted)] hover:text-[var(--ink)] underline"
          >
            Re-enroll new authenticator device
          </button>
        </div>
      )}
    </form>
  );
}

export default function MfaPage() {
  return (
    <AuthLayout
      eyebrow="Clinical Security Layer"
      title="Multi-Factor Authentication"
      subtitle="Institutional clinical safety workspaces enforce multi-factor TOTP verification for all healthcare professionals."
      footerLinks={
        <p className="my-0">
          Having trouble with your authenticator?{" "}
          <Link href="/contact" className="text-[var(--green)] font-[650] hover:underline">
            Contact Safety Officer
          </Link>
        </p>
      }
    >
      <React.Suspense fallback={<div className="p-8 text-center text-[13px] text-[var(--muted)]">Loading MFA challenge...</div>}>
        <MfaForm />
      </React.Suspense>
    </AuthLayout>
  );
}
