/**
 * Pramana-V1 - Clinical Handoff Intelligence & Omission Detection Engine
 * Team: Unknown GenZ
 *
 * Implements Section 10:
 * - Compares source clinical chart records with clinician shift handoff summaries
 * - Identifies omitted critical findings: allergies, active medications, pending lab orders, code status
 * - Produces an interactive, source-grounded professional verification checklist
 * - Enforces human-in-the-loop sign-off (never automatically approves transfers)
 */

if (typeof window !== "undefined") {
  throw new Error("[Pramana-V1 Security] Server-only AI module attempted to execute in a browser client environment.");
}
import { generateStructuredClinicalJson } from "./gemini-client";
import type { HandoffOmissionItem, EvidenceSourceLocation } from "./types";

export interface HandoffVerificationInput {
  documentId: string;
  documentTitle: string;
  versionNumber?: number;
  sourceChartText: string;
  handoffSummary: string;
}

const HANDOFF_SYSTEM_PROMPT = `You are the Pramana-V1 Clinical Handoff Safety Validator.
Your task is to compare a primary medical chart/encounter with a shift handoff summary written by an outgoing clinician.
Identify CRITICAL clinical items present in the chart that were completely OMITTED or glossed over in the handoff.
Look specifically for:
1. Documented severe allergies.
2. High-risk active medications (anticoagulants, insulin, cardiac meds).
3. Pending diagnostic tests or lab cultures requiring shift follow-up.
4. Resuscitation / Code status instructions.
5. Critical warning signs.

Every omitted finding must include:
- The exact quote from the source medical chart proving it was documented.
- The categorization.
- Why omission represents a patient safety risk.

Never infer facts not in the source chart. Output valid JSON matching the requested schema.`;

interface RawHandoffOutput {
  omissions: {
    category: "allergy" | "medication" | "pending_lab" | "code_status" | "followup_task";
    item: string;
    sourceQuote: string;
    safetyRisk: string;
  }[];
}

/**
 * Evaluates handoff notes against primary source records for missing safety-critical information
 */
export async function evaluateClinicalHandoff(
  input: HandoffVerificationInput
): Promise<HandoffOmissionItem[]> {
  const prompt = `Evaluate this shift handoff:

<source_medical_chart document_id="${input.documentId}" title="${input.documentTitle}">
${input.sourceChartText}
</source_medical_chart>

<outgoing_handoff_summary>
${input.handoffSummary}
</outgoing_handoff_summary>

Analyze for critical omissions and return JSON:
{
  "omissions": [
    {
      "category": "allergy",
      "item": "Name of omitted medication, allergy, or pending order",
      "sourceQuote": "Exact text from source chart",
      "safetyRisk": "Why omitting this in shift handoff poses a patient danger"
    }
  ]
}`;

  try {
    const { data } = await generateStructuredClinicalJson<RawHandoffOutput>(
      prompt,
      HANDOFF_SYSTEM_PROMPT,
      25000
    );

    if (!Array.isArray(data.omissions) || data.omissions.some(o=>!o.sourceQuote?.trim() || !input.sourceChartText.includes(o.sourceQuote))) throw new Error("Handoff evidence could not be verified.");
    return data.omissions.map((o) => {
      const loc: EvidenceSourceLocation = {
        documentId: input.documentId,
        versionNumber: input.versionNumber ?? 1,
        rawQuote: o.sourceQuote,
      };

      return {
        id: crypto.randomUUID(),
        category: o.category,
        item: o.item,
        sourceEvidence: loc,
        handoffSummaryMention: null,
        isOmitted: true,
        reviewedByClinician: false,
      };
    });
  } catch (err: any) {
    throw new Error("Handoff analysis unavailable or evidence could not be verified.");
  }
}
