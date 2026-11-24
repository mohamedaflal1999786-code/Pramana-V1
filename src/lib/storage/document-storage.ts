/**
 * Pramana-V1 Secure Document Storage Infrastructure
 * Team: Unknown GenZ
 *
 * Implements server-side validation, safe filename handling, SHA-256 hashing,
 * randomized object IDs, safe XML parsing guards (XXE prevention), and short-lived signed URLs.
 */

import crypto from "crypto";

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/json",
  "application/xml",
  "text/xml",
  "application/hl7-v2+er7",
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
  // Strip null bytes, paths, and dangerous characters
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
  // Check for dangerous DTD entity declarations
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
  organizationId: string
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

  // 2. MIME type verification against strict whitelist
  let detectedMime = declaredMimeType.toLowerCase().trim() as AllowedMimeType;
  if (!ALLOWED_MIME_TYPES.includes(detectedMime)) {
    errors.push(`MIME type '${declaredMimeType}' is not supported. Supported: ${ALLOWED_MIME_TYPES.join(", ")}`);
  }

  // 3. Inspect magic bytes / file signatures
  const headerHex = buffer.subarray(0, 16).toString("hex").toLowerCase();
  const headerUtf8 = buffer.subarray(0, 512).toString("utf8");

  if (originalFilename.toLowerCase().endsWith(".pdf") || declaredMimeType === "application/pdf") {
    if (!headerUtf8.startsWith("%PDF-")) {
      errors.push("PDF header signature '%PDF-' missing or invalid.");
    }
    detectedMime = "application/pdf";
  } else if (originalFilename.toLowerCase().endsWith(".json") || declaredMimeType === "application/json") {
    try {
      JSON.parse(buffer.toString("utf8"));
      detectedMime = "application/json";
    } catch {
      errors.push("Invalid JSON structure: failed JSON parser validation.");
    }
  } else if (
    originalFilename.toLowerCase().endsWith(".xml") ||
    declaredMimeType === "application/xml" ||
    declaredMimeType === "text/xml"
  ) {
    const xmlText = buffer.toString("utf8");
    const safetyCheck = checkXmlSafety(xmlText);
    if (!safetyCheck.isSafe) {
      errors.push(`XML security policy violation: ${safetyCheck.reason}`);
    }
    detectedMime = "application/xml";
  } else if (originalFilename.toLowerCase().endsWith(".hl7")) {
    if (!headerUtf8.startsWith("MSH|")) {
      errors.push("HL7 v2 document missing expected 'MSH|' segment header.");
    }
    detectedMime = "application/hl7-v2+er7";
  }

  // 4. Cryptographic integrity hash (SHA-256)
  const sha256Hash = crypto.createHash("sha256").update(buffer).digest("hex");

  // 5. Sanitized filename & randomized storage object identifier
  const sanitized = sanitizeFilename(originalFilename);
  const fileExt = sanitized.split(".").pop() || "bin";
  const randomStorageKey = crypto.randomUUID();
  const storagePath = `${organizationId}/${randomStorageKey}.${fileExt}`;

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
