"use server";
import { requireClinicalMember, requirePatient } from "@/lib/care/access";
import { GraphService } from "@/lib/graph/graph-service";
import { LineageEngine } from "@/lib/graph/lineage-engine";
import { ImpactAnalyzer } from "@/lib/graph/impact-analyzer";
import { SimulationEngine } from "@/lib/graph/simulation-engine";
import { reviewClinicalFindingAction } from "./ai-actions";

export async function getPatientSafetyProvenanceGraphAction(patientId?: string) {
  const scope = await requirePatient(patientId);
  return GraphService.getPatientSPG(scope.patientId, scope.org);
}

async function authorizeNode(nodeId: string) {
  const { admin, member } = await requireClinicalMember();
  const { data } = await admin.from("evidence_nodes").select("id,reference_id,node_type,patient_id")
    .eq("organization_id",member.organization_id).eq("id",nodeId).maybeSingle();
  if (!data) throw new Error("Evidence unavailable.");
  const scope = await requirePatient(data.patient_id);
  return {node:data, scope};
}

export async function traceEvidenceLineageAction(nodeId:string) {
  const {node,scope} = await authorizeNode(nodeId);
  return LineageEngine.traceEvidenceLineage(node.id,scope.org,scope.patientId);
}

export async function runForwardImpactAnalysisAction(nodeId:string) {
  const {node,scope} = await authorizeNode(nodeId);
  return ImpactAnalyzer.runForwardImpactAnalysis(node.id,scope.org,6,scope.patientId);
}

export async function reviewGraphFindingAction(nodeId:string,decision:"endorsed"|"rejected"|"clarification_requested",rationale:string) {
  const {node,scope} = await authorizeNode(nodeId);
  if (node.node_type !== "clinical_finding") throw new Error("Select a finding.");
  const {data} = await scope.admin.from("safety_alerts").select("id").eq("organization_id",scope.org)
    .eq("patient_id",scope.patientId).eq("id",node.reference_id).maybeSingle();
  if (!data) throw new Error("Linked alert unavailable.");
  return reviewClinicalFindingAction(data.id,decision,rationale);
}

export async function runCounterfactualSimulationAction(params: Omit<Parameters<typeof SimulationEngine.runSimulation>[0],"organizationId"|"patientId"> & {patientId?:string}) {
  const {org,patientId} = await requirePatient(params.patientId);
  return SimulationEngine.runSimulation({...params,organizationId:org,patientId});
}
