/**
 * Pramana-V1 - Deterministic Clinical Safety Rules Engine
 * Team: Unknown GenZ
 *
 * Implements deterministic clinical safety rules separated from LLM generation.
 * Follows Section 7 specifications:
 * - Authoritative, documented clinical references (FDA, RxNorm, KDIGO, AAAAI)
 * - Drug-Drug Interactions (DDI)
 * - Drug-Allergy Hypersensitivity Conflicts
 * - Critical Dosage Boundaries
 * - Renal Function Contraindications
 * - Clear limitation labeling for research-stage evaluation
 */

import type {
  DeterministicSafetyRule,
  ExtractedClinicalEntity,
  SafetyFinding,
  EvidenceSourceLocation,
} from "./types";

export const RESEARCH_SAFETY_RULEBOOK: DeterministicSafetyRule[] = [
  {
    ruleCode: "DDI-WAR-NSAID",
    name: "Warfarin + NSAID / Antiplatelet Severe Bleeding Risk",
    category: "drug_interaction",
    severity: "critical",
    description:
      "Concurrent administration of Warfarin with non-steroidal anti-inflammatory drugs (NSAIDs, including Aspirin, Ibuprofen, Naproxen) significantly enhances gastrointestinal and systemic bleeding risks due to platelet inhibition and gastric mucosal injury.",
    clinicalRationale:
      "NSAIDs inhibit platelet cyclooxygenase (COX-1), blunt platelet aggregation, and induce gastric erosion, compounding oral vitamin K antagonist anticoagulation (Warfarin).",
    referenceSource: "FDA Warfarin Black Box Warning / RxNorm 2026.1 / Chest Guidelines",
    referenceVersion: "2026-Q1-RESEARCH",
    applicableConditions: ["Anticoagulation therapy", "Pain management", "Cardiovascular prophylaxis"],
    knownLimitations:
      "Cardioprotective low-dose aspirin (81mg) may be intentionally co-prescribed with mechanical valves under specialist monitoring; requires clinician verification.",
  },
  {
    ruleCode: "ALL-PEN-BETA",
    name: "Penicillin Allergy Cross-Reactivity with Beta-Lactam Antibiotics",
    category: "allergy_conflict",
    severity: "critical",
    description:
      "Patient has a documented hypersensitivity / allergy to Penicillin, but a beta-lactam antibiotic (e.g. Amoxicillin, Ampicillin) is actively documented or prescribed.",
    clinicalRationale:
      "IgE-mediated hypersensitivity to beta-lactam core structures poses immediate life-threatening anaphylaxis, angioedema, or bronchospasm.",
    referenceSource: "AAAAI Practice Parameter for Drug Allergy / FDA Amoxicillin Label",
    referenceVersion: "2026-Q1-RESEARCH",
    applicableConditions: ["Bacterial infection therapy"],
    knownLimitations:
      "Historical patient-reported penicillin allergies may be inaccurate or outgrown; formal allergy de-labeling or skin testing may supersede.",
  },
  {
    ruleCode: "RENAL-MET-CKD",
    name: "Metformin Contraindicated in Severe Renal Impairment",
    category: "contraindication",
    severity: "critical",
    description:
      "Metformin is prescribed or continued in the setting of severe renal impairment (documented eGFR < 30 mL/min/1.73m² or Serum Creatinine >= 1.8 mg/dL in unstable acute states).",
    clinicalRationale:
      "Metformin is cleared almost entirely by renal tubular filtration. Reduced renal clearance promotes accumulation of metformin, triggering potentially fatal metformin-associated lactic acidosis (MALA).",
    referenceSource: "FDA Drug Safety Communication / KDIGO Clinical Practice Guideline on Diabetes Management in CKD",
    referenceVersion: "2026-Q1-RESEARCH",
    applicableConditions: ["Type 2 Diabetes Mellitus with Chronic Kidney Disease Stage 4/5"],
    knownLimitations:
      "eGFR must be evaluated based on steady-state serum creatinine, not single transient acute post-hydration dips.",
  },
  {
    ruleCode: "DDI-CLOP-PPI",
    name: "Clopidogrel and Omeprazole Cytochrome P450 2C19 Inhibition",
    category: "drug_interaction",
    severity: "moderate",
    description:
      "Concomitant use of Clopidogrel with Omeprazole or Esomeprazole substantially decreases the antiplatelet activity of Clopidogrel.",
    clinicalRationale:
      "Clopidogrel requires biotransformation to its active thiol metabolite by hepatic CYP2C19. Omeprazole is a competitive CYP2C19 inhibitor, significantly reducing antiplatelet effect and increasing ischemic risk.",
    referenceSource: "FDA Clopidogrel Package Insert / ACCF/ACG/AHA Consensus Document",
    referenceVersion: "2026-Q1-RESEARCH",
    applicableConditions: ["Acute Coronary Syndrome", "Post-PCI Stenting"],
    knownLimitations:
      "Pantoprazole exhibits less CYP2C19 inhibition and is frequently substituted.",
  },
  {
    ruleCode: "DOSE-LISINOPRIL-MAX",
    name: "Lisinopril Maximum Therapeutic Dosage Exceeded",
    category: "dosage_limit",
    severity: "moderate",
    description:
      "Documented Lisinopril dosage exceeds the standard maximum approved monotherapy threshold of 40 mg once daily.",
    clinicalRationale:
      "Doses above 40 mg daily rarely provide additional antihypertensive efficacy and exponentially increase rates of hyperkalemia, profound orthostatic hypotension, and acute kidney injury.",
    referenceSource: "FDA Approved Lisinopril Monograph / USP-NF",
    referenceVersion: "2026-Q1-RESEARCH",
    applicableConditions: ["Hypertension", "Heart Failure"],
    knownLimitations:
      "Certain nephrology proteinuric protocols may cautiously titrate to 80mg under close laboratory monitoring.",
  },
  {
    ruleCode: "DDI-ACE-ARB",
    name: "Dual Renin-Angiotensin-Aldosterone System (RAAS) Blockade",
    category: "drug_interaction",
    severity: "high",
    description:
      "Concurrent administration of an ACE inhibitor (e.g. Lisinopril) and an Angiotensin Receptor Blocker (ARB, e.g. Losartan, Valsartan).",
    clinicalRationale:
      "Dual RAAS blockade does not confer additional cardiovascular benefit over monotherapy while significantly increasing the incidence of severe hyperkalemia, syncope, and acute renal failure.",
    referenceSource: "ONTARGET Trial / ACC/AHA Guideline for the Management of Heart Failure",
    referenceVersion: "2026-Q1-RESEARCH",
    applicableConditions: ["Hypertension", "Heart Failure with Reduced Ejection Fraction"],
    knownLimitations:
      "Rare refractory proteinuria management in specialized research protocols.",
  },
];

/**
 * Normalizes a drug name string for rule comparison
 */
function normalizeDrugName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Evaluates the deterministic safety rulebook against a collection of clinical entities
 */
export function evaluateDeterministicSafetyRules(
  entities: ExtractedClinicalEntity[]
): SafetyFinding[] {
  const findings: SafetyFinding[] = [];

  const medications = entities.filter((e) => e.entityType === "medication" && e.status === "current" && !e.isNegated && e.sourceLocation.rawQuote.toLowerCase().includes(e.name.toLowerCase()));
  const allergies = entities.filter((e) => e.entityType === "allergy" && !e.isNegated && e.sourceLocation.rawQuote.toLowerCase().includes(e.name.toLowerCase()));
  const labs = entities.filter((e) => e.entityType === "lab_result" && !e.isNegated);

  const normalizedMeds = medications.map((m) => ({
    entity: m,
    norm: normalizeDrugName(m.name),
  }));

  // ---------------------------------------------------------------------------
  // Rule 1: Warfarin + NSAID / Aspirin (DDI-WAR-NSAID)
  // ---------------------------------------------------------------------------
  const warfarin = normalizedMeds.find((m) => m.norm.includes("warfarin"));
  const nsaid = normalizedMeds.find(
    (m) =>
      m.norm.includes("aspirin") ||
      m.norm.includes("ibuprofen") ||
      m.norm.includes("naproxen") ||
      m.norm.includes("ketorolac") ||
      m.norm.includes("diclofenac") ||
      m.norm.includes("meloxicam")
  );

  if (warfarin && nsaid) {
    const rule = RESEARCH_SAFETY_RULEBOOK.find((r) => r.ruleCode === "DDI-WAR-NSAID")!;
    findings.push({
      id: crypto.randomUUID(),
      ruleCode: rule.ruleCode,
      severity: rule.severity,
      title: `${rule.name}: ${warfarin.entity.name} + ${nsaid.entity.name}`,
      summary: `Patient is prescribed ${warfarin.entity.name} concurrently with ${nsaid.entity.name}. Compounded antiplatelet and anticoagulant effects create severe hemorrhage hazard.`,
      clinicalRationale: rule.clinicalRationale,
      referenceSource: rule.referenceSource,
      evidenceNodeIds: [warfarin.entity.id, nsaid.entity.id],
      supportingSpans: [warfarin.entity.sourceLocation, nsaid.entity.sourceLocation],
      reviewStatus: "unverified",
      isDeterministic: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Rule 2: Penicillin Allergy + Beta-Lactam Antibiotic (ALL-PEN-BETA)
  // ---------------------------------------------------------------------------
  const penAllergy = allergies.find((a) => {
    const norm = normalizeDrugName(a.name);
    return norm.includes("penicillin") || norm.includes("amoxicillin") || norm.includes("ampicillin");
  });

  const betaLactamMed = normalizedMeds.find(
    (m) =>
      m.norm.includes("amoxicillin") ||
      m.norm.includes("ampicillin") ||
      m.norm.includes("augmentin") ||
      m.norm.includes("piperacillin") ||
      m.norm.includes("penicillin")
  );

  if (penAllergy && betaLactamMed) {
    const rule = RESEARCH_SAFETY_RULEBOOK.find((r) => r.ruleCode === "ALL-PEN-BETA")!;
    findings.push({
      id: crypto.randomUUID(),
      ruleCode: rule.ruleCode,
      severity: rule.severity,
      title: `Critical Allergy Conflict: ${penAllergy.name} Allergy vs ${betaLactamMed.entity.name}`,
      summary: `Documented ${penAllergy.name} hypersensitivity directly conflicts with active ${betaLactamMed.entity.name} prescription. Risk of severe anaphylaxis.`,
      clinicalRationale: rule.clinicalRationale,
      referenceSource: rule.referenceSource,
      evidenceNodeIds: [penAllergy.id, betaLactamMed.entity.id],
      supportingSpans: [penAllergy.sourceLocation, betaLactamMed.entity.sourceLocation],
      reviewStatus: "unverified",
      isDeterministic: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Rule 3: Metformin + Severe Renal Impairment (RENAL-MET-CKD)
  // ---------------------------------------------------------------------------
  const metformin = normalizedMeds.find((m) => m.norm.includes("metformin"));
  const renalLab = labs.find((l) => {
    const measured = l.sourceLocation.rawQuote.match(/\beGFR\s*[:=]?\s*(\d+(?:\.\d+)?)\s*mL\/min\/1\.73\s*m(?:2|²)/i);
    return measured !== null && Number(measured[1]) < 30;
  });

  if (metformin && renalLab) {
    const rule = RESEARCH_SAFETY_RULEBOOK.find((r) => r.ruleCode === "RENAL-MET-CKD")!;
    findings.push({
      id: crypto.randomUUID(),
      ruleCode: rule.ruleCode,
      severity: rule.severity,
      title: `Renal Contraindication: ${metformin.entity.name} in Renal Impairment`,
      summary: `Documented ${metformin.entity.name} prescription in the presence of compromised renal function (${renalLab.name}). High risk of Metformin-Associated Lactic Acidosis (MALA).`,
      clinicalRationale: rule.clinicalRationale,
      referenceSource: rule.referenceSource,
      evidenceNodeIds: [metformin.entity.id, renalLab.id],
      supportingSpans: [metformin.entity.sourceLocation, renalLab.sourceLocation],
      reviewStatus: "unverified",
      isDeterministic: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Rule 4: Clopidogrel + Omeprazole (DDI-CLOP-PPI)
  // ---------------------------------------------------------------------------
  const clopidogrel = normalizedMeds.find((m) => m.norm.includes("clopidogrel") || m.norm.includes("plavix"));
  const omeprazole = normalizedMeds.find(
    (m) => m.norm.includes("omeprazole") || m.norm.includes("prilosec") || m.norm.includes("esomeprazole")
  );

  if (clopidogrel && omeprazole) {
    const rule = RESEARCH_SAFETY_RULEBOOK.find((r) => r.ruleCode === "DDI-CLOP-PPI")!;
    findings.push({
      id: crypto.randomUUID(),
      ruleCode: rule.ruleCode,
      severity: rule.severity,
      title: `CYP2C19 Inhibition: ${clopidogrel.entity.name} + ${omeprazole.entity.name}`,
      summary: `${omeprazole.entity.name} inhibits CYP2C19 activation of ${clopidogrel.entity.name}, blunting antiplatelet protection and elevating secondary cardiac event risk.`,
      clinicalRationale: rule.clinicalRationale,
      referenceSource: rule.referenceSource,
      evidenceNodeIds: [clopidogrel.entity.id, omeprazole.entity.id],
      supportingSpans: [clopidogrel.entity.sourceLocation, omeprazole.entity.sourceLocation],
      reviewStatus: "unverified",
      isDeterministic: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Rule 5: Lisinopril Overdose Boundary (DOSE-LISINOPRIL-MAX)
  // ---------------------------------------------------------------------------
  const lisinoprilHighDose = normalizedMeds.find((m) => {
    if (!m.norm.includes("lisinopril")) return false;
    const dose = m.entity.sourceLocation.rawQuote.match(/\blisinopril\s+(\d+(?:\.\d+)?)\s*mg\s+(?:once\s+)?daily\b/i);
    return dose !== null && Number(dose[1]) > 40;
  });

  if (lisinoprilHighDose) {
    const rule = RESEARCH_SAFETY_RULEBOOK.find((r) => r.ruleCode === "DOSE-LISINOPRIL-MAX")!;
    findings.push({
      id: crypto.randomUUID(),
      ruleCode: rule.ruleCode,
      severity: rule.severity,
      title: `Therapeutic Dosage Exceeded: ${lisinoprilHighDose.entity.name}`,
      summary: `Documented dosage for ${lisinoprilHighDose.entity.name} exceeds standard approved maximum of 40mg daily. Risk of hyperkalemia and profound hypotension.`,
      clinicalRationale: rule.clinicalRationale,
      referenceSource: rule.referenceSource,
      evidenceNodeIds: [lisinoprilHighDose.entity.id],
      supportingSpans: [lisinoprilHighDose.entity.sourceLocation],
      reviewStatus: "unverified",
      isDeterministic: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Rule 6: Dual RAAS Blockade (DDI-ACE-ARB)
  // ---------------------------------------------------------------------------
  const aceInhibitor = normalizedMeds.find(
    (m) =>
      m.norm.includes("lisinopril") ||
      m.norm.includes("enalapril") ||
      m.norm.includes("ramipril") ||
      m.norm.includes("captopril")
  );
  const arb = normalizedMeds.find(
    (m) =>
      m.norm.includes("losartan") ||
      m.norm.includes("valsartan") ||
      m.norm.includes("telmisartan") ||
      m.norm.includes("candesartan")
  );

  if (aceInhibitor && arb) {
    const rule = RESEARCH_SAFETY_RULEBOOK.find((r) => r.ruleCode === "DDI-ACE-ARB")!;
    findings.push({
      id: crypto.randomUUID(),
      ruleCode: rule.ruleCode,
      severity: rule.severity,
      title: `Dual RAAS Blockade: ${aceInhibitor.entity.name} + ${arb.entity.name}`,
      summary: `Co-prescription of an ACE inhibitor (${aceInhibitor.entity.name}) and an ARB (${arb.entity.name}) increases hyperkalemia and acute renal failure risk without incremental clinical benefit.`,
      clinicalRationale: rule.clinicalRationale,
      referenceSource: rule.referenceSource,
      evidenceNodeIds: [aceInhibitor.entity.id, arb.entity.id],
      supportingSpans: [aceInhibitor.entity.sourceLocation, arb.entity.sourceLocation],
      reviewStatus: "unverified",
      isDeterministic: true,
    });
  }

  return findings;
}
