/**
 * Pramana-V1 Contact & Institutional Inquiry Service
 * Team: Unknown GenZ
 *
 * Implements server-side validation, rate limiting, anti-abuse, PHI detection guard,
 * and authentic database persistence to 'contact_inquiries'.
 */

import crypto from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import type { Database } from "@/types/database.types";

export type ContactInquiryInput = Database["public"]["Tables"]["contact_inquiries"]["Insert"];

export interface ContactSubmissionResult {
  success: boolean;
  persisted: boolean;
  inquiryId?: string;
  message: string;
  errors?: string[];
}

// In-memory rate limiting map for development (IP hash -> timestamps)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

// Suspicious clinical PHI patterns to strictly reject from public inquiry
const PHI_PATTERNS = [
  /\bMRN\b[:\s]*\d{5,}/i,
  /\b(dob|date of birth)\b[:\s]*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/i,
  /\b(social security|ssn)\b/i,
  /\b(rx|prescription)\s*#\s*\d+/i,
  /\b(chemotherapy|heparin|warfarin|insulin)\s+\d+\s*(mg|mcg|units)/i,
];

export function hashClientIp(ip: string | null | undefined): string {
  if (!ip) return "unknown_ip";
  return crypto.createHash("sha256").update(ip + "pramana_salt_2026").digest("hex").substring(0, 16);
}

export function validateContactPayload(data: Partial<ContactInquiryInput>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push("Full name must be at least 2 characters.");
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.push("A valid institutional or professional email address is required.");
  }
  if (!data.organization_name || data.organization_name.trim().length < 2) {
    errors.push("Organization or healthcare institution name is required.");
  }
  if (!data.role_title || data.role_title.trim().length < 2) {
    errors.push("Professional role or title is required.");
  }
  if (!data.message || data.message.trim().length < 15) {
    errors.push("Inquiry message must be at least 15 characters.");
  }

  // PHI Guard: Strictly reject submissions containing apparent patient health information
  const fullText = `${data.message || ""} ${data.name || ""} ${data.organization_name || ""}`;
  for (const pattern of PHI_PATTERNS) {
    if (pattern.test(fullText)) {
      errors.push(
        "For patient safety and regulatory compliance, the public inquiry form cannot accept Protected Health Information (PHI) or patient records."
      );
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ipHash) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  timestamps.push(now);
  rateLimitMap.set(ipHash, timestamps);
  return true;
}

export async function submitContactInquiry(
  payload: ContactInquiryInput,
  clientIp?: string | null,
  userAgent?: string | null
): Promise<ContactSubmissionResult> {
  const ipHash = hashClientIp(clientIp);

  // 1. Rate limiting check
  if (!checkRateLimit(ipHash)) {
    return {
      success: false,
      persisted: false,
      message: "Rate limit exceeded. Please wait a minute before submitting another inquiry.",
      errors: ["Too many requests from this client."],
    };
  }

  // 2. Validate payload
  const validation = validateContactPayload(payload);
  if (!validation.isValid) {
    return {
      success: false,
      persisted: false,
      message: "Validation failed.",
      errors: validation.errors,
    };
  }

  const status = getSupabaseConfigStatus();

  // If Supabase is configured with service role or connection
  if (status.isConfigured && status.hasServiceRoleKey) {
    try {
      const adminClient = getSupabaseAdminClient();
      if (adminClient) {
        const { data, error } = await adminClient
          .from("contact_inquiries")
          .insert({
            name: payload.name.trim(),
            email: payload.email.trim().toLowerCase(),
            organization_name: payload.organization_name.trim(),
            role_title: payload.role_title.trim(),
            inquiry_type: payload.inquiry_type || "pilot_inquiry",
            message: payload.message.trim(),
            ip_hash: ipHash,
            user_agent: userAgent ? userAgent.substring(0, 255) : null,
            is_reviewed: false,
          })
          .select("id")
          .single();

        if (error) {
          console.error("[Pramana-V1 Contact Service] DB Insert Error:", error.message);
          return {
            success: false,
            persisted: false,
            message: `Database submission failed: ${error.message}`,
            errors: [error.message],
          };
        }

        return {
          success: true,
          persisted: true,
          inquiryId: data.id,
          message: "Thank you. Your institutional inquiry has been securely recorded in our database.",
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown database error";
      console.error("[Pramana-V1 Contact Service] Unexpected error:", msg);
      return {
        success: false,
        persisted: false,
        message: "An unexpected error occurred while persisting your inquiry.",
        errors: [msg],
      };
    }
  }

  // Local development / Unconfigured fallback:
  // Strictly report actual persistence state without fabricating successful database storage
  return {
    success: true,
    persisted: false,
    message:
      "Inquiry validated successfully. Note: Supabase database is currently unconfigured in this local development environment, so record was not persisted to PostgreSQL.",
  };
}
