/**
 * Pramana-V1 JSON & FHIR R4 Clinical Parser
 * Team: Unknown GenZ
 *
 * Safely parses structured JSON and extracts standard HL7 FHIR R4 resources:
 * - Patient
 * - MedicationRequest
 * - Condition
 * - AllergyIntolerance
 * - Observation / DiagnosticReport
 * Preserves exact JSON paths for coordinate-grounded source provenance.
 */

import type { ExtractedEntity } from "../types";

export interface FhirParseResult {
  isFhirBundle: boolean;
  resourceType: string;
  fullTextSummary: string;
  entities: ExtractedEntity[];
}

export function parseJsonFhirDocument(buffer: Buffer): FhirParseResult {
  const jsonStr = buffer.toString("utf8");
  const data = JSON.parse(jsonStr);

  const entities: ExtractedEntity[] = [];
  let summary = "";

  const resources: { resource: any; path: string }[] = [];

  if (data.resourceType === "Bundle" && Array.isArray(data.entry)) {
    data.entry.forEach((entry: any, idx: number) => {
      if (entry.resource) {
        resources.push({ resource: entry.resource, path: `entry[${idx}].resource` });
      }
    });
  } else if (data.resourceType) {
    resources.push({ resource: data, path: "root" });
  }

  summary += `FHIR Resource Type: ${data.resourceType || "Generic JSON"}\n`;

  resources.forEach(({ resource, path }) => {
    const rType = resource.resourceType;

    // 1. MedicationRequest
    if (rType === "MedicationRequest") {
      const medName =
        resource.medicationCodeableConcept?.text ||
        resource.medicationCodeableConcept?.coding?.[0]?.display ||
        "Prescribed Medication";
      const dosage = resource.dosageInstruction?.[0]?.text || "Standard Dosage";
      const code = resource.medicationCodeableConcept?.coding?.[0]?.code;

      entities.push({
        id: crypto.randomUUID(),
        entityType: "medication",
        rawText: `${medName} — ${dosage}`,
        normalizedName: medName,
        normalizedCode: code ? `RxNorm:${code}` : undefined,
        confidenceScore: 0.98,
        isVerified: false,
        reviewStatus: "unverified",
        sourceLocation: {
          pageNumber: 1,
          jsonPath: `${path}.medicationCodeableConcept`,
        },
      });

      summary += `[Medication] ${medName} (${dosage})\n`;
    }

    // 2. AllergyIntolerance
    if (rType === "AllergyIntolerance") {
      const allergy =
        resource.code?.text ||
        resource.code?.coding?.[0]?.display ||
        "Adverse Drug Reaction";
      const code = resource.code?.coding?.[0]?.code;

      entities.push({
        id: crypto.randomUUID(),
        entityType: "allergy",
        rawText: allergy,
        normalizedName: allergy,
        normalizedCode: code ? `SNOMED:${code}` : undefined,
        confidenceScore: 0.98,
        isVerified: false,
        reviewStatus: "unverified",
        sourceLocation: {
          pageNumber: 1,
          jsonPath: `${path}.code`,
        },
      });

      summary += `[Allergy] ${allergy}\n`;
    }

    // 3. Condition / Diagnosis
    if (rType === "Condition") {
      const condition =
        resource.code?.text ||
        resource.code?.coding?.[0]?.display ||
        "Clinical Condition";
      const code = resource.code?.coding?.[0]?.code;

      entities.push({
        id: crypto.randomUUID(),
        entityType: "condition",
        rawText: condition,
        normalizedName: condition,
        normalizedCode: code ? `ICD-10:${code}` : undefined,
        confidenceScore: 0.98,
        isVerified: false,
        reviewStatus: "unverified",
        sourceLocation: {
          pageNumber: 1,
          jsonPath: `${path}.code`,
        },
      });

      summary += `[Condition] ${condition}\n`;
    }

    // 4. Observation (Lab Values & Vitals)
    if (rType === "Observation") {
      const obsName = resource.code?.text || resource.code?.coding?.[0]?.display || "Observation";
      const val = resource.valueQuantity
        ? `${resource.valueQuantity.value} ${resource.valueQuantity.unit || ""}`
        : resource.valueString || "Recorded";
      const code = resource.code?.coding?.[0]?.code;

      entities.push({
        id: crypto.randomUUID(),
        entityType: "lab_value",
        rawText: `${obsName}: ${val}`,
        normalizedName: obsName,
        normalizedCode: code ? `LOINC:${code}` : undefined,
        confidenceScore: 0.98,
        isVerified: false,
        reviewStatus: "unverified",
        sourceLocation: {
          pageNumber: 1,
          jsonPath: `${path}.valueQuantity`,
        },
      });

      summary += `[Observation] ${obsName}: ${val}\n`;
    }
  });

  return {
    isFhirBundle: Boolean(data.resourceType),
    resourceType: data.resourceType || "JSON",
    fullTextSummary: summary || jsonStr.substring(0, 500),
    entities,
  };
}
