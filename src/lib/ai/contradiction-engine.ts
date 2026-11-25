/**
 * Pramana-V1 - Cross-Document Contradiction & Discrepancy Detection Engine
 * Team: Unknown GenZ
 *
 * Implements Section 8:
 * - Compares two or more clinical records for the same patient/encounter
 * - Identifies conflicts in dosages, medications, allergies, and laboratory findings
 * - Distinguishes legitimate chronological changes (e.g. dose titrated up over time)
 *   from accidental transcription contradictions
 * - Extracts exact dual-source evidence coordinates
 */

if (typeof window !== "undefined") {
  throw new Error("[Pramana-V1 Security] Server-only AI module attempted to execute in a browser client environment.");
}
import { generateStructuredClinicalJson } from "./gemini-client";
import type { ClinicalContradiction, EvidenceSourceLocation } from "./types";

export interface DocumentComparisonInput {
  docA: {
    id: string;
    title: string;
    version: number;
    timestamp: string;
    text: string;
  };
  docB: {
    id: string;
    title: string;
    version: number;
    timestamp: string;
    text: string;
  };
}

const CONTRADICTION_SYSTEM_PROMPT = `You are the Pramana-V1 Clinical Discrepancy Analyzer.
Your task is to identify genuine clinical discrepancies and contradictions between two clinical documents for the same patient.
STRICT GUIDELINES:
1. Compare medications, dosages, frequency, documented allergies, and laboratory values.
2. Distinguish legitimate chronological changes (e.g., patient condition improved and medication was discontinued or escalated) from unintended contradictions.
3. Every contradiction MUST cite the exact verbatim text quote from Document A and Document B.
4. Output must be valid JSON matching the requested structure.
5. NEVER infer facts not present in either document.
6. If no contradictions exist, return an empty array for "contradictions".`;

interface RawContradictionOutput {
  contradictions: {
    entityName: string;
    findingDescription: string;
    docA_quote: string;
    docA_value: string;
    docB_quote: string;
    docB_value: string;
    discrepancyReason: string;
    isLegitimateChange: boolean;
  }[];
}

/**
 * Detects discrepancies between two clinical documents using Gemini with strict evidence citation
 */
export async function detectCrossDocumentContradictions(
  input: DocumentComparisonInput
): Promise<ClinicalContradiction[]> {
  const prompt = `Compare these two clinical records for the same patient:

<document_a id="${input.docA.id}" title="${input.docA.title}" date="${input.docA.timestamp}">
${input.docA.text}
</document_a>

<document_b id="${input.docB.id}" title="${input.docB.title}" date="${input.docB.timestamp}">
${input.docB.text}
</document_b>

Analyze for contradictions and return JSON:
{
  "contradictions": [
    {
      "entityName": "Medication or finding name",
      "findingDescription": "Concise clinical explanation of the contradiction",
      "docA_quote": "Exact quote from Document A",
      "docA_value": "Documented value or dosage in Document A",
      "docB_quote": "Exact quote from Document B",
      "docB_value": "Documented value or dosage in Document B",
      "discrepancyReason": "Why this represents an inconsistency or medication reconciliation error",
      "isLegitimateChange": false
    }
  ]
}`;

  try {
    const { data } = await generateStructuredClinicalJson<RawContradictionOutput>(
      prompt,
      CONTRADICTION_SYSTEM_PROMPT,
      25000
    );

    const results: ClinicalContradiction[] = (data.contradictions || []).map((c) => {
      const locA: EvidenceSourceLocation = {
        documentId: input.docA.id,
        versionNumber: input.docA.version,
        rawQuote: c.docA_quote || c.docA_value,
      };

      const locB: EvidenceSourceLocation = {
        documentId: input.docB.id,
        versionNumber: input.docB.version,
        rawQuote: c.docB_quote || c.docB_value,
      };

      return {
        id: crypto.randomUUID(),
        findingDescription: c.findingDescription,
        entityName: c.entityName,
        sourceA: {
          documentTitle: input.docA.title,
          timestamp: input.docA.timestamp,
          value: c.docA_value,
          location: locA,
        },
        sourceB: {
          documentTitle: input.docB.title,
          timestamp: input.docB.timestamp,
          value: c.docB_value,
          location: locB,
        },
        discrepancyReason: c.discrepancyReason,
        isLegitimateChange: c.isLegitimateChange,
        reviewStatus: "unverified",
      };
    });

    return results;
  } catch (err: any) {
    console.error("[Contradiction Engine Error]:", err.message);
    return [];
  }
}
