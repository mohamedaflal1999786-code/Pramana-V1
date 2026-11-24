/**
 * Pramana-V1 - Google Gemini AI Client Foundation
 *
 * Architectural foundation prepared for future phases (Clinical extraction & grounding).
 *
 * STRICT AUTHENTICITY NOTICE:
 * In accordance with healthcare research and patient safety standards, no fabricated AI
 * responses, hallucinations, or mock diagnostic endpoints are generated. When valid
 * credentials and audit pipelines are connected in future phases, the Gemini SDK client
 * will process clinical documents under human oversight.
 */

export interface GeminiConfigStatus {
  isConfigured: boolean;
  missingVariables: string[];
}

export function getGeminiConfigStatus(): GeminiConfigStatus {
  const apiKey = process.env.GEMINI_API_KEY;
  const missing: string[] = [];

  if (!apiKey || apiKey.includes("placeholder")) {
    missing.push("GEMINI_API_KEY");
  }

  return {
    isConfigured: missing.length === 0,
    missingVariables: missing,
  };
}
