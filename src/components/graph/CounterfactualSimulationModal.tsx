"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  X,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Beaker,
  RefreshCw,
} from "lucide-react";
import { runCounterfactualSimulationAction } from "@/lib/actions/graph-actions";
import type { SimulationResult } from "@/lib/graph/types";

interface CounterfactualSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
}

export function CounterfactualSimulationModal({
  isOpen,
  onClose,
  patientId,
}: CounterfactualSimulationModalProps) {
  const [selectedScenario, setSelectedScenario] = React.useState<
    "discontinue_warfarin" | "correct_lisinopril_dose" | "resolve_penicillin_allergy"
  >("discontinue_warfarin");
  const [isSimulating, setIsSimulating] = React.useState(false);
  const [simulationResult, setSimulationResult] = React.useState<SimulationResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setError(null);
    setSimulationResult(null);

    try {
      let hypothesisType: any = "modify_entity";
      let scenarioName = "";
      let description = "";
      let hypotheticalChanges: any = {};

      if (selectedScenario === "discontinue_warfarin") {
        hypothesisType = "remove_entity";
        scenarioName = "Discontinue Warfarin (Eliminate Bleeding DDI)";
        description = "Simulate withholding oral anticoagulant Warfarin before invasive procedure";
        hypotheticalChanges = {
          removeEntityNames: ["Warfarin", "warfarin"],
        };
      } else if (selectedScenario === "correct_lisinopril_dose") {
        hypothesisType = "modify_entity";
        scenarioName = "Titrate Lisinopril to 20mg daily (Within Safe Ceiling)";
        description = "Reduce supratherapeutic Lisinopril dose from 80mg to guideline standard 20mg";
        hypotheticalChanges = {
          modifyEntities: [
            { name: "Lisinopril", dosage: "20mg daily" },
          ],
        };
      } else if (selectedScenario === "resolve_penicillin_allergy") {
        hypothesisType = "remove_entity";
        scenarioName = "Negative Penicillin Skin Test (Resolve Beta-Lactam Conflict)";
        description = "Simulate confirmed allergy de-labeling following formal allergist skin test";
        hypotheticalChanges = {
          removeEntityNames: ["Penicillin", "penicillin"],
        };
      }

      const res = await runCounterfactualSimulationAction({
        patientId,
        scenarioName,
        hypothesisType,
        description,
        hypotheticalChanges,
      });

      setSimulationResult(res);
    } catch (err: any) {
      setError(err?.message || "Simulation failed to execute.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-[12px] border border-[var(--line)] max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f5fbf7] text-[#145a45] flex items-center justify-center">
              <Beaker className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[16px] font-[700] text-[var(--ink)] my-0">
                Counterfactual Evidence Simulation
              </h3>
              <p className="text-[12px] text-[var(--muted)] my-0">
                Zero-mutation research mode: Evaluate clinical what-if hypotheses without altering chart state.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--ink)] p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-[12px] font-[650] text-[var(--ink)] block">
            Select Clinical Hypothesis:
          </label>
          <div className="grid grid-cols-1 gap-2">
            <label
              className={`p-3 rounded-[8px] border cursor-pointer transition-all flex items-start gap-3 ${
                selectedScenario === "discontinue_warfarin"
                  ? "border-[#145a45] bg-[#f5fbf7]"
                  : "border-[var(--line)] bg-[#faf9f5]"
              }`}
            >
              <input
                type="radio"
                name="scenario"
                checked={selectedScenario === "discontinue_warfarin"}
                onChange={() => setSelectedScenario("discontinue_warfarin")}
                className="mt-1"
              />
              <div>
                <span className="text-[13px] font-[650] text-[var(--ink)] block">
                  Hypothesis A: Withhold Warfarin Therapy
                </span>
                <span className="text-[11px] text-[var(--muted)] block">
                  Hypothesizes complete discontinuation of Warfarin to assess resolution of the Severe Bleeding DDI with Aspirin.
                </span>
              </div>
            </label>

            <label
              className={`p-3 rounded-[8px] border cursor-pointer transition-all flex items-start gap-3 ${
                selectedScenario === "correct_lisinopril_dose"
                  ? "border-[#145a45] bg-[#f5fbf7]"
                  : "border-[var(--line)] bg-[#faf9f5]"
              }`}
            >
              <input
                type="radio"
                name="scenario"
                checked={selectedScenario === "correct_lisinopril_dose"}
                onChange={() => setSelectedScenario("correct_lisinopril_dose")}
                className="mt-1"
              />
              <div>
                <span className="text-[13px] font-[650] text-[var(--ink)] block">
                  Hypothesis B: Dose Titration — Lisinopril 80mg → 20mg Daily
                </span>
                <span className="text-[11px] text-[var(--muted)] block">
                  Tests reduction of supratherapeutic ACE inhibitor dose within clinical ceiling (&le; 40mg/day).
                </span>
              </div>
            </label>

            <label
              className={`p-3 rounded-[8px] border cursor-pointer transition-all flex items-start gap-3 ${
                selectedScenario === "resolve_penicillin_allergy"
                  ? "border-[#145a45] bg-[#f5fbf7]"
                  : "border-[var(--line)] bg-[#faf9f5]"
              }`}
            >
              <input
                type="radio"
                name="scenario"
                checked={selectedScenario === "resolve_penicillin_allergy"}
                onChange={() => setSelectedScenario("resolve_penicillin_allergy")}
                className="mt-1"
              />
              <div>
                <span className="text-[13px] font-[650] text-[var(--ink)] block">
                  Hypothesis C: Penicillin Allergy De-labeling
                </span>
                <span className="text-[11px] text-[var(--muted)] block">
                  Simulates documented negative skin test to clear Amoxicillin-clavulanate contraindication.
                </span>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[#fdf2f2] border border-[#f5c6c6] rounded-[7px] text-[12px] text-[#991b1b]">
            {error}
          </div>
        )}

        {/* Simulation Diff Output */}
        {simulationResult && (
          <div className="p-4 bg-[#faf9f5] border border-[var(--line)] rounded-[8px] space-y-3 text-[12px]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <span className="font-[650] text-[var(--ink)]">Hypothetical Simulation Outcome</span>
              <Badge variant="verified">Isolated In-Memory Re-evaluation</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 bg-white border border-[var(--line)] rounded-[6px]">
                <span className="text-[10px] text-[var(--muted)] block">Baseline Alerts Triggered</span>
                <span className="text-[18px] font-[700] text-[#991b1b]">
                  {simulationResult.originalFindings.length}
                </span>
              </div>
              <div className="p-2.5 bg-white border border-[var(--line)] rounded-[6px]">
                <span className="text-[10px] text-[var(--muted)] block">Simulated Alerts Triggered</span>
                <span className="text-[18px] font-[700] text-[#145a45]">
                  {simulationResult.simulatedFindings.length}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-[650] text-[#145a45] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Alerts Resolved in Hypothetical State ({simulationResult.resolvedFindings.length}):
              </span>
              {simulationResult.resolvedFindings.length === 0 ? (
                <p className="text-[11px] text-[var(--muted)] italic pl-4">No alerts resolved in this scenario.</p>
              ) : (
                <ul className="list-disc list-inside text-[11px] text-[var(--ink)] pl-2 space-y-0.5">
                  {simulationResult.resolvedFindings.map((f, i) => (
                    <li key={i}>{f.label}</li>
                  ))}
                </ul>
              )}
            </div>

            {simulationResult.newAlertsTriggered.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-[650] text-[#b91c1c] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  New Emergent Alerts ({simulationResult.newAlertsTriggered.length}):
                </span>
                <ul className="list-disc list-inside text-[11px] text-[var(--ink)] pl-2 space-y-0.5">
                  {simulationResult.newAlertsTriggered.map((f, i) => (
                    <li key={i}>{f.label}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunSimulation}
            isLoading={isSimulating}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Execute In-Memory Simulation
          </Button>
        </div>
      </div>
    </div>
  );
}
