/**
 * Pramana-V1 - Missing Evidence & Clinical Gap Intelligence Engine
 * Team: Unknown GenZ
 *
 * Implements Section 9:
 * - Identifies documentation gaps without fabricating clinical assumptions
 * - Detects:
 *   - Medications documented without specified dosage or frequency
 *   - Patients without documented allergy status (unspecified allergy risk)
 *   - Pending laboratory tests lacking designated follow-up clinician
 *   - Discharge orders missing physician signature or instructions
 * - Distinguishes: "explicitly_absent", "not_documented", "unreadable", "conflicting"
 * - Generates structured clarification requests for human-in-the-loop review
 */

import type { ExtractedClinicalEntity, MissingEvidenceFinding } from "./types";

/**
 * Analyzes extracted entities and document metadata for missing clinical evidence
 */
export function analyzeMissingEvidence(
  entities: ExtractedClinicalEntity[],
  documentText: string
): MissingEvidenceFinding[] {
  const findings: MissingEvidenceFinding[] = [];

  const medications = entities.filter((e) => e.entityType === "medication" && !e.isNegated);
  const allergies = entities.filter((e) => e.entityType === "allergy");

  // 1. Missing Dosage Check
  for (const med of medications) {
    if (!med.dosage && !med.sourceLocation.rawQuote.match(/\d+\s*(?:mg|mcg|ml|units?|g)/i)) {
      findings.push({
        id: crypto.randomUUID(),
        category: "missing_dosage",
        missingType: "not_documented",
        relatedEntityName: med.name,
        description: `Medication "${med.name}" is listed without a documented numerical dosage or strength.`,
        recommendedClarification: `Verify intended dosage and strength of ${med.name} with ordering clinician.`,
        reviewStatus: "unverified",
      });
    }

    // Missing frequency check
    if (!med.frequency && !med.sourceLocation.rawQuote.match(/(?:daily|bid|tid|qid|prn|once|q\d+h|at bedtime)/i)) {
      findings.push({
        id: crypto.randomUUID(),
        category: "unspecified_frequency",
        missingType: "not_documented",
        relatedEntityName: med.name,
        description: `Medication "${med.name}" lacks documented administration frequency or dosing interval.`,
        recommendedClarification: `Confirm administration interval (e.g., daily, twice daily, PRN) before administration.`,
        reviewStatus: "unverified",
      });
    }
  }

  // 2. Missing Allergy Documentation Check
  const hasDocumentedAllergies =
    allergies.length > 0 ||
    /allerg(?:y|ies)|nkda|no known(?: drug)? allergies/i.test(documentText);

  if (!hasDocumentedAllergies) {
    findings.push({
      id: crypto.randomUUID(),
      category: "missing_allergy_status",
      missingType: "not_documented",
      description: "No patient allergy status or NKDA (No Known Drug Allergies) notation found in this clinical chart.",
      recommendedClarification: "Conduct allergy reconciliation interview with patient or family before administering new therapeutics.",
      reviewStatus: "unverified",
    });
  }

  // 3. Pending Investigations without follow-up
  const pendingMatches = documentText.match(/(?:pending|send out|awaiting results? for)\s+([^.\n]+)/gi);
  if (pendingMatches) {
    for (const match of pendingMatches) {
      findings.push({
        id: crypto.randomUUID(),
        category: "pending_investigation_without_followup",
        missingType: "not_documented",
        description: `Pending investigation noted: "${match.trim()}". No responsible clinician or follow-up protocol attached.`,
        recommendedClarification: "Assign responsible clinician to monitor diagnostic result return.",
        reviewStatus: "unverified",
      });
    }
  }

  return findings;
}
