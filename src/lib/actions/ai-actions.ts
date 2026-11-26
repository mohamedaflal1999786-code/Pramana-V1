/**
 * Pramana-V1 - Authenticated Gemini AI Clinical Server Actions
 * Team: Unknown GenZ
 *
 * Implements server-side authenticated actions:
 * - Full AI Document Analysis Pipeline
 * - Evidence Grounding & Persistence
 * - Deterministic Safety Alerts Creation
 * - Human Professional Review (Endorse / Reject / Clarify)
 * - Clinical Handoff Verification
 * - Multilingual Discharge Generation
 * - AI Provider Health & Status Monitoring
 * - Immutable Audit Logging
 */

"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/auth/audit";
import { checkGeminiHealth, isGeminiConfigured, getGeminiModelName } from "@/lib/ai/gemini-client";
import { extractClinicalEntitiesWithGemini } from "@/lib/ai/entity-extractor";
import { filterValidEvidenceSpans } from "@/lib/ai/grounding-validator";
import { evaluateDeterministicSafetyRules } from "@/lib/ai/safety-rules";
import { analyzeMissingEvidence } from "@/lib/ai/missing-evidence";
import { evaluateClinicalHandoff } from "@/lib/ai/handoff-engine";
import { SUPPORTED_LANGUAGES_MAP } from "@/lib/ai/languages";
import { generateMultilingualDischargeDraft } from "@/lib/ai/multilingual-discharge";
import { parsePdfDocument } from "@/lib/extraction/parsers/pdf-parser";
import type {
  AiAnalysisJobResult,
  SafetyFinding,
  FindingReviewStatus,
  SupportedLanguage,
  MultilingualDischargeDraft,
  HandoffOmissionItem,
} from "@/lib/ai/types";

import { readClinicalSource } from "@/lib/care/source";
import { requireClinicalMember, assignedPatientIds, requirePatient } from "@/lib/care/access";

/**
 * 1. AI System Health & Provider Status
 */
export async function getAiEngineHealthAction() {
  await requireClinicalMember();
  const isConfigured = isGeminiConfigured();
  const health = await checkGeminiHealth();

  return {
    isConfigured,
    modelName: getGeminiModelName(),
    isOnline: health.isOnline,
    latencyMs: health.latencyMs,
    error: health.error,
  };
}

/**
 * 2. Run Comprehensive AI Clinical Analysis on an Ingested Document
 */
export async function runClinicalDocumentAiAnalysisAction(
  documentId: string
): Promise<AiAnalysisJobResult> {
  const {scope:{admin,user},doc,version,text:documentText} = await readClinicalSource(documentId);
  const docVersionId = version.id;

  // Create extraction_jobs record
  const jobId = crypto.randomUUID();
  await admin.from("extraction_jobs").insert({
    id: jobId,
    organization_id: doc.organization_id,
    document_version_id: docVersionId,
    status: "processing",
    model_version: getGeminiModelName(),
    started_at: new Date().toISOString(),
  }).throwOnError();

  try {
    // 3. Extract Clinical Entities via Gemini
    const extractionResult = await extractClinicalEntitiesWithGemini(
      doc.id,
      doc.current_version_number,
      documentText
    );

    // 4. Validate Grounding & Reject Hallucinations
    const allSpans = extractionResult.entities.map((e) => e.sourceLocation);
    const { validSpans, rejectedCount } = await filterValidEvidenceSpans(
      allSpans,
      doc.organization_id,
      doc.patient_id,
      documentText
    );

    const accepted = new Set(validSpans);
    const entities = extractionResult.entities.filter(e => accepted.has(e.sourceLocation));
    // 5. Evaluate Deterministic Safety Rulebook
    const safetyFindings = evaluateDeterministicSafetyRules(entities);

    // 6. Analyze Missing Evidence & Clinical Gaps
    const missingEvidence = analyzeMissingEvidence(entities, documentText);

    const {error:saveError} = await admin.rpc("finish_grounded_analysis",{
      p_job:jobId,p_actor:user.id,p_entities:JSON.parse(JSON.stringify(entities)),p_findings:JSON.parse(JSON.stringify(safetyFindings)),
      p_metadata:{entityCount:entities.length,alertCount:safetyFindings.length,rejectedHallucinations:rejectedCount}
    });
    if (saveError) throw new Error("Analysis unavailable or already recorded for this version.");
    return {
      jobId,
      documentId: doc.id,
      patientId: doc.patient_id,
      success: true,
      extractedEntities: entities,
      safetyFindings,
      contradictions: [],
      missingEvidence,
      usage: {
        promptTokens: extractionResult.promptTokens,
        completionTokens: extractionResult.completionTokens,
        totalTokens: extractionResult.promptTokens + extractionResult.completionTokens,
        processingDurationMs: extractionResult.durationMs,
        modelVersion: getGeminiModelName(),
      },
    };
  } catch (err: any) {
    await admin
      .from("extraction_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: "Clinical analysis did not complete.",
      })
      .eq("id", jobId);

    throw err;
  }
}

/**
 * 3. Fetch Safety Alerts for a Patient or Workspace
 */
export async function getPatientSafetyAlertsAction(patientId?: string): Promise<SafetyFinding[]> {
  const ctx = await requireClinicalMember();
  const {admin,member} = ctx;
  const ids = await assignedPatientIds(ctx);
  if (!ids.length) return [];

  let query = admin
    .from("safety_alerts")
    .select("id, severity, title, summary, status, created_at").eq("organization_id",member.organization_id).in("patient_id",ids);

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  const { data: alerts, error } = await query.order("created_at", { ascending: false }).limit(20);

  if (error || !alerts) throw new Error("Unable to load safety alerts.");

  return alerts.map((a) => ({
    id: a.id,
    ruleCode: "SAFETY-ALERT",
    severity: (a.severity === "medium" ? "moderate" : a.severity) as any,
    title: a.title,
    summary: a.summary,
    clinicalRationale: a.summary,
    referenceSource: "Pramana-V1 Safety Rulebook",
    evidenceNodeIds: [],
    supportingSpans: [],
    reviewStatus: a.status as any,
    isDeterministic: true,

  }));
}

/**
 * 4. Human Professional Review of a Clinical Alert (Endorse / Reject / Clarify)
 */
export async function reviewClinicalFindingAction(
  alertId: string,
  decision: "endorsed" | "rejected" | "clarification_requested",
  rationale: string
): Promise<{ success: boolean; message: string }> {
  const { client } = await requireClinicalMember();
  const { error } = await client.rpc("review_care_alert",{p_alert:alertId,p_decision:decision,p_rationale:rationale});
  if (error) throw new Error("Review unavailable or already closed.");
  return { success: true, message: "Review saved." };
}

/**
 * 5. Run Shift Handoff AI Verification Action
 */
export async function runHandoffAiAnalysisAction(
  encounterId: string,
  handoffSummary: string,
  documentId: string
): Promise<{ omissions: HandoffOmissionItem[] }> {
  if (!handoffSummary.trim() || handoffSummary.length > 16000) throw new Error("A handoff summary is required.");
  const {scope,doc,version,text} = await readClinicalSource(documentId);
  if (!encounterId || doc.encounter_id !== encounterId) throw new Error("Select a document linked to this encounter.");
  const {data} = await scope.admin.from("encounters").select("id").eq("id",encounterId)
    .eq("organization_id",scope.org).eq("patient_id",scope.patientId).maybeSingle();
  if (!data) throw new Error("Encounter unavailable.");
  const omissions = await evaluateClinicalHandoff({documentId,documentTitle:doc.title,versionNumber:version.version_number,sourceChartText:text,handoffSummary});
  return { omissions };
}

/**
 * 6. Generate Multilingual Discharge Draft Action
 */
export async function generateMultilingualDischargeAction(
  patientId: string,
  dischargeText: string,
  targetLanguage: SupportedLanguage
): Promise<{ draft: MultilingualDischargeDraft }> {
  const {client, admin, member, org} = await requirePatient(patientId);
  if (member.role_id !== "doctor" || !dischargeText.trim() || dischargeText.length > 16000 ||
      !Object.prototype.hasOwnProperty.call(SUPPORTED_LANGUAGES_MAP,targetLanguage)) throw new Error("Invalid translation request.");
  const draft = await generateMultilingualDischargeDraft(patientId,dischargeText,targetLanguage);
  const numbers = (s:string) => (s.match(/\d+(?:[.,]\d+)*/g) || []).sort().join("|");
  if (!draft.translatedInstructions.trim() || numbers(dischargeText) !== numbers(draft.translatedInstructions)) throw new Error("Quantities differ. Translation requires revision.");
  const meds=await admin.from("medications").select("drug_name").eq("organization_id",org).eq("patient_id",patientId);
  if(meds.error || meds.data.some(m=>dischargeText.toLowerCase().includes(m.drug_name.toLowerCase()) && !draft.translatedInstructions.toLowerCase().includes(m.drug_name.toLowerCase()))) throw new Error("Medication name verification failed.");
  const {data,error} = await client.rpc("save_discharge_draft",{p_org:org,p_patient:patientId,p_language:targetLanguage,p_source:dischargeText,p_translation:draft.translatedInstructions});
  if (error || !data) throw new Error("Draft could not be saved.");
  return {draft:{...draft,id:data}};
}

export async function approveDischarge(id:string,rationale:string) {
  const {client} = await requireClinicalMember();
  const {error} = await client.rpc("approve_discharge_draft",{p_id:id,p_rationale:rationale});
  if (error) throw new Error("Approval could not be recorded.");
}
