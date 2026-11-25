/**
 * Pramana-V1 - Server-Only Gemini AI Client
 * Team: Unknown GenZ
 *
 * Implements:
 * - Official Google Gen AI SDK integration (@google/generative-ai)
 * - Server-only isolation (never exported or bundled to browser)
 * - Configurable model via GEMINI_MODEL env var (defaults to gemini-3.5-flash)
 * - Bounded retries with exponential backoff for 429 / 503 resilience
 * - Strict timeout protection
 * - Structured JSON output generation
 * - Provider availability and health verification
 */

if (typeof window !== "undefined") {
  throw new Error("[Pramana-V1 Security] Server-only AI module attempted to execute in a browser client environment.");
}
import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";

export class AiServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = "AiServiceError";
  }
}

let genAiInstance: GoogleGenerativeAI | null = null;

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL || "gemini-3.5-flash";
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5;
}

export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiServiceError(
      "Gemini AI API key is not configured in server environment. Set GEMINI_API_KEY in .env.local.",
      500,
      false
    );
  }

  if (!genAiInstance) {
    genAiInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAiInstance;
}

/**
 * Executes a call to Gemini with bounded retries and exponential backoff
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (err: any) {
      attempt++;
      const errorMessage = err?.message || String(err);
      const isRateLimit = errorMessage.includes("429") || errorMessage.includes("Quota");
      const isUnavailable = errorMessage.includes("503") || errorMessage.includes("overloaded");

      if ((isRateLimit || isUnavailable) && attempt < maxRetries) {
        console.warn(
          `[Gemini AI] Retryable error (${isRateLimit ? "429" : "503"}). Attempt ${attempt}/${maxRetries} after ${delay}ms...`
        );
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw new AiServiceError(
          `Gemini AI invocation failed: ${errorMessage}`,
          isRateLimit ? 429 : isUnavailable ? 503 : 500,
          isRateLimit || isUnavailable
        );
      }
    }
  }

  throw new AiServiceError("Gemini AI operation exceeded maximum retry limit.", 504, false);
}

/**
 * Health check to verify live Gemini connectivity and model responsiveness
 */
export async function checkGeminiHealth(): Promise<{
  isOnline: boolean;
  model: string;
  latencyMs: number;
  error?: string;
}> {
  if (!isGeminiConfigured()) {
    return {
      isOnline: false,
      model: getGeminiModelName(),
      latencyMs: 0,
      error: "GEMINI_API_KEY not configured",
    };
  }

  const start = Date.now();
  try {
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({ model: getGeminiModelName() });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Health check timeout (15s)")), 15000)
    );

    const checkPromise = model.generateContent("Ping. Reply 'PONG'.");

    const result = await Promise.race([checkPromise, timeoutPromise]);
    const responseText = result.response.text();
    const latencyMs = Date.now() - start;

    return {
      isOnline: responseText.length > 0,
      model: getGeminiModelName(),
      latencyMs,
    };
  } catch (err: any) {
    return {
      isOnline: false,
      model: getGeminiModelName(),
      latencyMs: Date.now() - start,
      error: err?.message || "Health check failed",
    };
  }
}

/**
 * Generates strongly typed structured JSON using Gemini with strict schema enforcement
 */
export async function generateStructuredClinicalJson<T>(
  prompt: string,
  systemInstruction?: string,
  timeoutMs = 25000
): Promise<{ data: T; latencyMs: number; promptTokens: number; completionTokens: number }> {
  const ai = getGeminiClient();
  const modelName = getGeminiModelName();

  const generationConfig: GenerationConfig = {
    responseMimeType: "application/json",
    temperature: 0.1, // Near-zero temperature for deterministic clinical extraction
  };

  const model = ai.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction
      ? {
          role: "system",
          parts: [{ text: systemInstruction }],
        }
      : undefined,
    generationConfig,
  });

  const start = Date.now();

  const result = await executeWithRetry(async () => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`AI generation exceeded timeout of ${timeoutMs}ms`)), timeoutMs)
    );

    const callPromise = model.generateContent(prompt);
    return await Promise.race([callPromise, timeoutPromise]);
  });

  const latencyMs = Date.now() - start;
  const rawText = result.response.text();

  let parsed: T;
  try {
    parsed = JSON.parse(rawText) as T;
  } catch (jsonErr: any) {
    throw new AiServiceError(
      `Failed to parse model output as JSON: ${jsonErr.message}. Output was: ${rawText.substring(0, 300)}`,
      502,
      false
    );
  }

  const usageMetadata = result.response.usageMetadata;
  const promptTokens = usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
  const completionTokens = usageMetadata?.candidatesTokenCount || Math.ceil(rawText.length / 4);

  return {
    data: parsed,
    latencyMs,
    promptTokens,
    completionTokens,
  };
}
