/**
 * Pramana-V1 Secure Document Storage Infrastructure
 * Team: Unknown GenZ
 *
 * Implements server-side validation, safe filename handling, SHA-256 hashing,
 * randomized object IDs, safe XML parsing guards (XXE prevention), Supabase private
 * bucket uploads, and short-lived signed URLs.
 */

import crypto from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/json",
  "application/xml",
  "text/xml",
  "application/hl7-v2+er7",
  "image/jpeg",
  "image/png",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export interface FileValidationResult {
  isValid: boolean;
  sanitizedFilename: string;
  mimeType: AllowedMimeType;
  fileSizeBytes: number;
  sha256Hash: string;
  storagePath: string;
  errors: string[];
}

/**
 * Sanitizes input filename to prevent directory traversal and filesystem attacks.
 */
export function sanitizeFilename(filename: string): string {
  const basename = filename.split(/[/\\]/).pop() || "unnamed_document";
  return basename
    .replace(/[^\w.-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .substring(0, 150);
}

/**
 * Validates XML content to prevent XML External Entity (XXE) injection attacks.
 */
export function checkXmlSafety(content: string): { isSafe: boolean; reason?: string } {
  if (/<!DOCTYPE[^>]*\[[^\]]*<!ENTITY[^>]*>/i.test(content)) {
    return { isSafe: false, reason: "Forbidden DTD ENTITY declaration detected (XXE protection)." };
  }
  if (/<!ENTITY\s+[%&\w]+\s+(SYSTEM|PUBLIC)/i.test(content)) {
    return { isSafe: false, reason: "External entity references (SYSTEM/PUBLIC) are strictly prohibited." };
  }
  return { isSafe: true };
}

/**
 * Server-side validation of uploaded clinical documents.
 */
export function validateClinicalDocument(
  buffer: Buffer,
  originalFilename: string,
  declaredMimeType: string,
  organizationId: string,
  patientId: string = "00000000-0000-0000-0000-000000000002"
): FileValidationResult {
  const errors: string[] = [];
  const fileSizeBytes = buffer.length;

  // 1. Size constraint: strictly max 25MB
  if (fileSizeBytes <= 0) {
    errors.push("Document file is empty (0 bytes).");
  } else if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    errors.push(
      `File size (${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of 25 MB.`
    );
  }

  // 2. Normalize declared MIME
  let detectedMime = declaredMimeType.toLowerCase().trim() as AllowedMimeType;
  const lowerName = originalFilename.toLowerCase();

  // 3. Inspect magic bytes / file signatures
  const headerHex = buffer.subarray(0, 16).toString("hex").toLowerCase();
  const headerUtf8 = buffer.subarray(0, 512).toString("utf8");

  if (lowerName.endsWith(".pdf") || declaredMimeType === "application/pdf") {
    if (!headerUtf8.startsWith("%PDF-")) {
      errors.push("PDF header signature '%PDF-' missing or invalid.");
    }
    detectedMime = "application/pdf";
  } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || declaredMimeType.includes("jpeg")) {
    if (!headerHex.startsWith("ffd8ff")) {
      errors.push("Invalid JPEG image header signature.");
    }
    detectedMime = "image/jpeg";
  } else if (lowerName.endsWith(".png") || declaredMimeType === "image/png") {
    if (!headerHex.startsWith("89504e470d0a1a0a")) {
      errors.push("Invalid PNG image header signature.");
    }
    detectedMime = "image/png";
  } else if (lowerName.endsWith(".json") || declaredMimeType === "application/json") {
    try {
      JSON.parse(buffer.toString("utf8"));
      detectedMime = "application/json";
    } catch {
      errors.push("Invalid JSON structure: failed JSON parser validation.");
    }
  } else if (
    lowerName.endsWith(".xml") ||
    declaredMimeType === "application/xml" ||
    declaredMimeType === "text/xml"
  ) {
    const xmlText = buffer.toString("utf8");
    const safetyCheck = checkXmlSafety(xmlText);
    if (!safetyCheck.isSafe) {
      errors.push(`XML security policy violation: ${safetyCheck.reason}`);
    }
    detectedMime = "application/xml";
  } else if (lowerName.endsWith(".hl7")) {
    if (!headerUtf8.startsWith("MSH|")) {
      errors.push("HL7 v2 document missing expected 'MSH|' segment header.");
    }
    detectedMime = "application/hl7-v2+er7";
  } else if (lowerName.endsWith(".txt") || declaredMimeType === "text/plain") {
    detectedMime = "text/plain";
  }

  if (!ALLOWED_MIME_TYPES.includes(detectedMime)) {
    errors.push(`MIME type '${declaredMimeType}' is not supported. Supported: ${ALLOWED_MIME_TYPES.join(", ")}`);
  }

  // 4. Cryptographic integrity hash (SHA-256)
  const sha256Hash = Buffer.isBuffer(buffer)
    ? crypto.createHash("sha256").update(buffer).digest("hex")
    : "0000000000000000000000000000000000000000000000000000000000000000";

  // 5. Sanitized filename & tenant-scoped storage path
  const sanitized = sanitizeFilename(originalFilename);
  const randomStorageKey = crypto.randomUUID();
  const storagePath = `${organizationId}/${patientId}/${randomStorageKey}/${sanitized}`;

  return {
    isValid: errors.length === 0,
    sanitizedFilename: sanitized,
    mimeType: detectedMime,
    fileSizeBytes,
    sha256Hash,
    storagePath,
    errors,
  };
}

/**
 * Uploads a validated clinical document buffer into the private Supabase storage bucket
 */
export async function uploadToClinicalStorage(
  buffer: Buffer,
  storagePath: string,
  mimeType: string
): Promise<{ success: boolean; error?: string }> {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return { success: false, error: "Supabase storage client unavailable." };
  }

  const { error } = await admin.storage
    .from("clinical-documents")
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Generates an authorized, short-lived signed URL to view a private clinical document
 */
export async function generateSignedDocumentUrl(
  storagePath: string,
  expiresInSeconds: number = 900 // 15 minutes default
): Promise<string | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data, error } = await admin.storage
    .from("clinical-documents")
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    console.error("[Storage Signed URL Error]:", error?.message);
    return null;
  }

  return data.signedUrl;
}

/**
 * Deletes a file from the private clinical storage bucket
 */
export async function deleteFromClinicalStorage(storagePath: string): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  if (!admin) return false;

  const { error } = await admin.storage
    .from("clinical-documents")
    .remove([storagePath]);

  return !error;
}
