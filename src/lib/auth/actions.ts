/**
 * Pramana-V1 - Real Supabase Authentication Server Actions & Services
 * Team: Unknown GenZ
 *
 * Implements genuine Supabase Auth flows:
 * - Email & Password Sign In
 * - Email & Password Registration
 * - Profile and Institutional Tenancy Creation
 * - Sign Out
 * - Password Reset Request & Password Update
 * - Verification Resend with Rate Limiting
 * - Healthcare Audit Logging
 */

"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/auth/audit";
import type { UserRole } from "@/types/database.types";

export interface AuthActionResult {
  success: boolean;
  message?: string;
  error?: string;
  redirectUrl?: string;
  requiresEmailVerification?: boolean;
}

// Memory-backed rate limit tracker for sensitive auth actions (resend, reset)
const rateLimitMap = new Map<string, { count: number; lastTimestamp: number }>();

function checkRateLimit(key: string, maxAttempts = 3, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry) {
    rateLimitMap.set(key, { count: 1, lastTimestamp: now });
    return true;
  }
  if (now - entry.lastTimestamp > windowMs) {
    rateLimitMap.set(key, { count: 1, lastTimestamp: now });
    return true;
  }
  if (entry.count >= maxAttempts) {
    return false;
  }
  entry.count += 1;
  return true;
}

/**
 * Validates password complexity against healthcare security standards:
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one numeric digit
 * - Contains at least one special character
 */
export async function validatePasswordComplexity(password: string): Promise<{ valid: boolean; reason?: string }> {
  if (password.length < 8) {
    return { valid: false, reason: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one uppercase letter (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one lowercase letter (a-z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one numerical digit (0-9)." };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one special character (!@#$%^&* etc)." };
  }
  return { valid: true };
}

/**
 * 1. Sign In with Email and Password
 */
export async function signInAction(
  formData: FormData,
  _returnUrl?: string
): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password || email.length > 254 || password.length > 256) {
    return { success: false, error: "Email address and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Authentication service currently unavailable. Please check system configuration." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    await logAuditEvent({
      action: "auth.login_failed",
      details: { reason: "Authentication failed" },
    });
    return { success: false, error: "Unable to sign in with these credentials." };
  }

  const user = data.user;
  if (!user) {
    return { success: false, error: "User session could not be established." };
  }

  // Check email confirmation status
  if (!user.email_confirmed_at) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Your email address has not been verified yet. Please check your inbox or request a new verification link.",
      requiresEmailVerification: true,
    };
  }

  // Audit login success
  await logAuditEvent({
    action: "auth.login_success",
    userId: user.id,
    details: {},
  });

  // Determine authorized workspace destination
  const admin = getSupabaseAdminClient();
  if (!admin) {
    await supabase.auth.signOut();
    return { success: false, error: "Workspace authorization unavailable." };
  }
  const { data: member, error: membershipError } = await admin
    .from("organization_members").select("role_id, is_active").eq("user_id", user.id).maybeSingle();
  const destinations: Record<string, string> = {
    institutional_admin: "admin", platform_admin: "admin", doctor: "doctor", pharmacist: "pharmacist", patient: "patient"
  };
  const role = member && destinations[member.role_id];
  const expected = formData.get("portal");
  if (membershipError || !member || !role || (expected && expected !== role)) {
    await supabase.auth.signOut();
    return { success: false, error: "No authorized membership for this portal." };
  }
  if (!member.is_active) return { success: true, redirectUrl: "/auth/pending-approval" };
  const targetUrl = "/workspaces/" + role;

  return {
    success: true,
    redirectUrl: targetUrl,
  };
}

/**
 * 2. Sign Up with Email and Password
 */
export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const requestedRole = (formData.get("role") as UserRole) || "doctor";
  const institution = (formData.get("institution") as string)?.trim();

  if (!fullName || fullName.length > 120 || !email || email.length > 254 || !password || password.length > 256 || (institution && institution.length > 160)) {
    return { success: false, error: "Please fill out all required fields." };
  }

  if (!["doctor", "pharmacist", "patient"].includes(requestedRole)) return { success: false, error: "Invalid registration role." };
  const passwordCheck = await validatePasswordComplexity(password);
  if (!passwordCheck.valid) {
    return { success: false, error: passwordCheck.reason };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Authentication service currently unavailable." };
  }

  // Register with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        requested_role: requestedRole,
        institution: institution || "Pramana Academic Health System",
      },
    },
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  const user = authData.user;
  if (!user) {
    return { success: false, error: "Failed to create user account." };
  }

  // Provision profile and pending organization membership via admin client
  const admin = getSupabaseAdminClient();
  if (admin) {
    const defaultOrgId = "00000000-0000-0000-0000-000000000001";

    // 1. Upsert Profile
    await admin.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      email: user.email || email,
    });

    // 2. Insert Membership as Pending (is_active = false)
    // Patients can be active by default if registered as patient, but professionals require approval
    const isPatient = false;
    await admin.from("organization_members").upsert(
      {
        organization_id: defaultOrgId,
        user_id: user.id,
        role_id: requestedRole,
        department: institution || "Clinical Staff",
        is_active: isPatient, // Patients active, professionals pending institutional review
      },
      { onConflict: "organization_id,user_id", ignoreDuplicates: true }
    );

    // Audit Signup
    await logAuditEvent({
      action: "auth.signup_requested",
      userId: user.id,
      organizationId: defaultOrgId,
      details: {
        email,
        requested_role: requestedRole,
        institution,
      },
    });
  }

  // Check if session was auto-created or if email confirmation is required
  if (!authData.session) {
    return {
      success: true,
      requiresEmailVerification: true,
      redirectUrl: `/auth/verify-email?email=${encodeURIComponent(email)}`,
      message: "Registration successful. Please verify your email to activate your account.",
    };
  }

  return {
    success: true,
    redirectUrl: "/auth/pending-approval",
    message: "Registration received. Pending institutional verification.",
  };
}

/**
 * 3. Sign Out Action
 */
export async function signOutAction(): Promise<AuthActionResult> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await logAuditEvent({
        action: "auth.logout",
        userId: user.id,
        details: {},
      });
    }

    await supabase.auth.signOut();
  }
  return { success: true, redirectUrl: "/auth/signin" };
}

/**
 * 4. Request Password Reset Link
 */
export async function requestPasswordResetAction(email: string): Promise<AuthActionResult> {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Please provide a valid email address." };
  }

  if (!checkRateLimit(`reset:${cleanEmail}`, 3, 60000)) {
    return {
      success: false,
      error: "Too many password reset requests. Please wait a minute before trying again.",
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Authentication service currently unavailable." };
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === "production" ? "https://pramana-v1.vercel.app" : "http://localhost:3000");
  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) {
    // Avoid account enumeration: still return generic confirmation unless rate limit
    console.error("[Password Reset Error]:", error.message);
  }

  await logAuditEvent({
    action: "auth.password_reset_requested",
    details: { email: cleanEmail },
  });

  return {
    success: true,
    message: "If an account exists with this email address, password recovery instructions have been dispatched.",
  };
}

/**
 * 5. Update Password
 */
export async function updatePasswordAction(
  newPassword: string,
  accessToken?: string
): Promise<AuthActionResult> {
  const passwordCheck = await validatePasswordComplexity(newPassword);
  if (!passwordCheck.valid) {
    return { success: false, error: passwordCheck.reason };
  }

  const supabase = await createSupabaseServerClient();
  let user: { id: string; email?: string } | null = null;

  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      user = data.user;
    }
  }

  // If no cookie-based session, try resolving via accessToken if provided from URL hash
  if (!user && accessToken) {
    const { createClient } = await import("@supabase/supabase-js");
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    const { data: tokenUser } = await anon.auth.getUser(accessToken);
    if (tokenUser?.user) {
      user = tokenUser.user;
    }
  }

  if (!user) {
    return {
      success: false,
      error: "Auth session missing. Please click the password reset link again or request a new one.",
    };
  }

  // Update password using admin client or session client
  const admin = getSupabaseAdminClient();
  if (admin) {
    const { error: adminUpdateErr } = await admin.auth.admin.updateUserById(
      user.id,
      { password: newPassword, email_confirm: true }
    );
    if (adminUpdateErr) {
      return { success: false, error: adminUpdateErr.message };
    }
  } else if (supabase) {
    const { error: sessionUpdateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (sessionUpdateErr) {
      return { success: false, error: sessionUpdateErr.message };
    }
  }

  await logAuditEvent({
    action: "auth.password_reset_completed",
    userId: user.id,
    details: {},
  });

  return {
    success: true,
    message: "Password has been successfully updated. You may now sign in with your new credentials.",
    redirectUrl: "/auth/signin",
  };
}

/**
 * 6. Resend Email Verification Link
 */
export async function resendVerificationAction(email: string): Promise<AuthActionResult> {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (!checkRateLimit(`verify:${cleanEmail}`, 2, 60000)) {
    return {
      success: false,
      error: "Rate limit reached. Please wait 60 seconds before requesting another verification email.",
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Authentication service currently unavailable." };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: cleanEmail,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: "A new email verification link has been dispatched to your email address.",
  };
}
