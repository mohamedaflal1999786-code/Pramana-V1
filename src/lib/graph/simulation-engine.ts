/**
 * Pramana-V1 - Counterfactual Evidence Simulation Engine
 * Team: Unknown GenZ
 * Phase: 07 — Safety Provenance Graph
 *
 * Implements isolated, zero-mutation counterfactual evidence simulations:
 * - Hypothesize entity corrections, dosage adjustments, or documentation gap resolution
 * - Re-evaluates deterministic safety rules on cloned in-memory models
 * - Compares baseline vs hypothetical graph states
 * - STRICT ISOLATION: Never alters live medical records or patient orders.
 */

import { GraphService } from "./graph-service";
import { evaluateDeterministicSafetyRules } from "@/lib/ai/safety-rules";
import type {
  CounterfactualScenario,
  SimulationResult,
  SPGNode,
  GraphNodeType,
} from "./types";
import type { ExtractedClinicalEntity } from "@/lib/ai/types";

export class SimulationEngine {
  /**
   * Executes an isolated what-if simulation against a patient's current graph state
   */
  public static async runSimulation(params: {
    patientId: string;
    organizationId: string;
    scenarioName: string;
    hypothesisType: CounterfactualScenario["hypothesisType"];
    description: string;
    hypotheticalChanges: CounterfactualScenario["hypotheticalChanges"];
  }): Promise<SimulationResult> {
    const scenario: CounterfactualScenario = {
      id: crypto.randomUUID(),
      patientId: params.patientId,
      scenarioName: params.scenarioName,
      hypothesisType: params.hypothesisType,
      description: params.description,
      hypotheticalChanges: params.hypotheticalChanges,
      simulatedAt: new Date().toISOString(),
    };

    // 1. Fetch current live SPG graph
    const liveGraph = await GraphService.getPatientSPG(params.patientId, params.organizationId);

    // Filter baseline active findings
    const originalFindings = liveGraph.nodes.filter(
      (n) => n.nodeType === "clinical_finding" && n.status === "active"
    );

    // 2. Reconstruct ExtractedClinicalEntity array from graph's entity nodes
    const baseEntities: ExtractedClinicalEntity[] = liveGraph.nodes
      .filter((n) =>
        ["extracted_entity", "medication_record", "documented_allergy", "lab_observation"].includes(n.nodeType)
      )
      .map((n) => ({
        id: n.referenceId,
        name: n.metadata.name || n.label,
        entityType: (n.metadata.entityType as any) || (n.nodeType === "medication_record" ? "medication" : n.nodeType === "documented_allergy" ? "allergy" : "medication"),
        dosage: n.metadata.dosage,
        frequency: n.metadata.frequency,
        route: n.metadata.route,
        status: (n.metadata.status as any) || "current",
        isNegated: false,
        normalizedCode: n.metadata.normalizedCode,
        confidenceScore: n.metadata.confidenceScore || 0.95,
        sourceLocation: {
          documentId: n.metadata.documentId || "simulated-doc",
          versionNumber: 1,
          pageNumber: 1,
          startOffset: 0,
          endOffset: 10,
          rawQuote: n.metadata.quote || n.label,
        },
      }));

    // 3. Apply Counterfactual In-Memory Modification
    const simulatedEntities: ExtractedClinicalEntity[] = JSON.parse(JSON.stringify(baseEntities));

    if (params.hypothesisType === "correct_entity_dosage") {
      const targetName = params.hypotheticalChanges.entityName?.toLowerCase();
      const newDose = params.hypotheticalChanges.newValue;
      for (const ent of simulatedEntities) {
        if (targetName && ent.name.toLowerCase().includes(targetName)) {
          ent.dosage = newDose;
        }
      }
    } else if (params.hypothesisType === "resolve_allergy_conflict") {
      const allergen = params.hypotheticalChanges.entityName?.toLowerCase();
      const idx = simulatedEntities.findIndex((e) => e.entityType === "allergy" && e.name.toLowerCase().includes(allergen || ""));
      if (idx !== -1) {
        simulatedEntities.splice(idx, 1); // Hypothesize allergy was refuted or documented as intolerance
      }
    } else if (params.hypothesisType === "supply_missing_evidence") {
      if (params.hypotheticalChanges.newValue) {
        simulatedEntities.push({
          id: crypto.randomUUID(),
          name: params.hypotheticalChanges.entityName || "eGFR",
          entityType: "lab_result",
          dosage: params.hypotheticalChanges.newValue,
          status: "current",
          isNegated: false,
          confidenceScore: 1.0,
          sourceLocation: {
            documentId: "simulated-lab-doc",
            versionNumber: 1,
            pageNumber: 1,
            startOffset: 0,
            endOffset: 10,
            rawQuote: `Simulated Lab: ${params.hypotheticalChanges.entityName} = ${params.hypotheticalChanges.newValue}`,
          },
        });
      }
    } else if (params.hypothesisType === "supersede_document") {
      // Discontinue or replace target medication
      const medName = params.hypotheticalChanges.entityName?.toLowerCase();
      for (const ent of simulatedEntities) {
        if (medName && ent.name.toLowerCase().includes(medName)) {
          ent.status = "discontinued";
        }
      }
    }

    // 4. Run Deterministic Safety Engine on Simulated Entities
    const simulatedFindingOutputs = evaluateDeterministicSafetyRules(simulatedEntities);

    const simulatedFindings: SPGNode[] = simulatedFindingOutputs.map((f) => ({
      id: f.id,
      organizationId: params.organizationId,
      patientId: params.patientId,
      nodeType: "clinical_finding",
      referenceId: f.id,
      label: f.title,
      status: "simulated",
      metadata: {
        title: f.title,
        summary: f.summary,
        severity: f.severity,
        ruleCode: f.ruleCode,
        clinicalRationale: f.clinicalRationale,
        isSimulated: true,
      },
      createdAt: new Date().toISOString(),
    }));

    // 5. Compute Comparative Diff
    const originalRuleCodes = new Set(originalFindings.map((f) => f.metadata.ruleCode));
    const simulatedRuleCodes = new Set(simulatedFindings.map((f) => f.metadata.ruleCode));

    const resolvedFindings = originalFindings.filter(
      (f) => !simulatedRuleCodes.has(f.metadata.ruleCode)
    );

    const newAlertsTriggered = simulatedFindings.filter(
      (f) => !originalRuleCodes.has(f.metadata.ruleCode)
    );

    const unchangedFindings = originalFindings.filter(
      (f) => simulatedRuleCodes.has(f.metadata.ruleCode)
    );

    const impactSummary = `Under hypothetical ${params.hypothesisType}: ${resolvedFindings.length} active alerts resolved, ${newAlertsTriggered.length} new alerts triggered, ${unchangedFindings.length} alerts unchanged.`;

    return {
      scenario,
      originalFindings,
      simulatedFindings,
      resolvedFindings,
      newAlertsTriggered,
      unchangedFindings,
      impactSummary,
    };
  }
}
