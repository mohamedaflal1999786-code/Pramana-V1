/**
 * Pramana-V1 - Supabase TOTP Multi-Factor Authentication (MFA)
 * Team: Unknown GenZ
 *
 * Implements genuine Supabase Auth MFA:
 * - TOTP Enrollment (QR code generation & secret string)
 * - Verification Challenge & Assurance Level elevation (AAL1 -> AAL2)
 * - Factor Listing & Factor Unenrollment
 * - Audit Trail logging for MFA events
 */

"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/auth/audit";

export interface MfaEnrollResult {
  success: boolean;
  factorId?: string;
  qrCode?: string; // SVG or data URI string
  secret?: string;
  error?: string;
}

export interface MfaVerifyResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

/**
 * 1. Enroll a new TOTP factor
 */
export async function enrollTotpFactorAction(): Promise<MfaEnrollResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Authentication service unavailable." };
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "Pramana-V1 Clinical Safety",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    factorId: data.id,
    qrCode: data.totp?.qr_code,
    secret: data.totp?.secret,
  };
}

/**
 * 2. Verify a TOTP factor during enrollment or login challenge
 */
export async function verifyTotpFactorAction(
  factorId: string,
  code: string,
  returnUrl?: string
): Promise<MfaVerifyResult> {
  const cleanCode = code.replace(/\D/g, "");
  if (cleanCode.length !== 6) {
    return { success: false, error: "Please enter the complete 6-digit authenticator code." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Authentication service unavailable." };
  }

  // Create challenge
  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });

  if (challengeError) {
    return { success: false, error: challengeError.message };
  }

  // Verify challenge
  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code: cleanCode,
  });

  if (verifyError) {
    await logAuditEvent({
      action: "auth.login_failed",
      details: { reason: "MFA challenge verification failed" },
    });
    return { success: false, error: "Invalid authenticator code. Please check your authenticator application." };
  }

  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    await logAuditEvent({
      action: "auth.mfa_verified",
      userId: userData.user.id,
      details: { factorId },
    });
  }

  const safeReturn = returnUrl && returnUrl.startsWith("/") ? returnUrl : "/workspaces/doctor";
  return {
    success: true,
    redirectUrl: safeReturn,
  };
}

/**
 * 3. List active MFA factors for the current user
 */
export async function listMfaFactorsAction() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { factors: [], aalLevel: "aal1" };

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  return {
    factors: factors?.totp || [],
    aalLevel: aalData?.currentLevel || "aal1",
    nextLevel: aalData?.nextLevel || "aal1",
  };
}

/**
 * 4. Unenroll an active TOTP factor
 */
export async function unenrollTotpFactorAction(factorId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Authentication service unavailable." };
  }

  const { error } = await supabase.auth.mfa.unenroll({
    factorId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    await logAuditEvent({
      action: "auth.mfa_disabled",
      userId: userData.user.id,
      details: { factorId },
    });
  }

  return { success: true };
}
