"use client";

import * as React from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Languages, CheckCircle2, ShieldCheck, HeartHandshake, Sparkles, AlertCircle } from "lucide-react";
import { pendingDischarges } from "@/lib/actions/care-actions";
import { PatientPicker } from "@/components/workspace/PatientPicker";
import { approveDischarge, generateMultilingualDischargeAction } from "@/lib/actions/ai-actions";
import { SUPPORTED_LANGUAGES_MAP } from "@/lib/ai/languages";
import type { SupportedLanguage, MultilingualDischargeDraft } from "@/lib/ai/types";

export default function MultilingualDischargePage() {
  const [patientId,setPatientId] = React.useState("");
  return <WorkspaceLayout pageTitle="Multilingual Discharge"><PatientPicker value={patientId} onChange={setPatientId}/>{patientId && <DraftEditor key={patientId} patientId={patientId}/>}</WorkspaceLayout>;
}
function DraftEditor({patientId}:{patientId:string}) {
  const [saved,setSaved] = React.useState<Awaited<ReturnType<typeof pendingDischarges>>>([]);
  const [notice,setNotice]=React.useState("");
  const refresh=React.useCallback(()=>pendingDischarges(patientId).then(setSaved).catch(()=>setNotice("Saved drafts unavailable.")),[patientId]);
  React.useEffect(()=>{void refresh();},[refresh]);
  const [targetLang, setTargetLang] = React.useState<SupportedLanguage>("ta");
  const [inputText,setInputText] = React.useState("");
  const [draft, setDraft] = React.useState<MultilingualDischargeDraft | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAttested, setIsAttested] = React.useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setIsAttested(false);
    try {
      const res = await generateMultilingualDischargeAction(
        patientId,
        inputText,
        targetLang
      );
      setDraft(res.draft); await refresh();
    } catch (err: any) {
      alert(`Translation failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section className="tile mb-4"><h2>Saved drafts awaiting review</h2><p role="status">{notice}</p>
        {saved.map(row=><details key={row.id}><summary>{row.language} · {row.id.slice(0,8)}</summary><h3>Original</h3><p className="whitespace-pre-wrap">{row.source}</p><h3>Translation</h3><p className="whitespace-pre-wrap">{row.translation}</p><button className="underline" onClick={async()=>{
          const reason=window.prompt("Record your review of names, doses, frequencies and instructions.");if(!reason?.trim())return;
          try {await approveDischarge(row.id,reason);setNotice("Approval recorded.");if(draft?.id===row.id)setIsAttested(true);await refresh();}catch{setNotice("Approval unavailable.");}
        }}>Approve reviewed instructions</button></details>)}</section>
      <PageHeader
        eyebrow="Patient Health Literacy & Safety"
        title="Multilingual Discharge Guidance"
        description="Convert complex physician discharge orders into accessible, plain-language patient instructions across 9 languages while strictly preserving medication names, dosages, and clinical thresholds."
        actions={
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-[650] text-[var(--muted)]">Target Language:</span>
            <select
              value={targetLang}
              disabled={isLoading} onChange={(e) => {setTargetLang(e.target.value as SupportedLanguage);setDraft(null);}}
              className="text-[13px] border border-[var(--line)] rounded-[6px] py-1.5 px-3 bg-white font-[650] text-[var(--ink)] cursor-pointer"
            >
              {Object.entries(SUPPORTED_LANGUAGES_MAP).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={handleTranslate}
              isLoading={isLoading}
              disabled={!inputText.trim()}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-white" />}
            >
              Translate & Simplify (Gemini)
            </Button>
          </div>
        }
      />

      {/* Side-by-Side Dual Column Translation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left Column: Clinician Orders */}
        <div className="bg-white p-6 rounded-[12px] border border-[var(--line)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">
              Source Clinician Discharge Orders
            </h3>
            <Badge variant="default">Medical Terminology (English)</Badge>
          </div>

          <textarea
            value={inputText}
            disabled={isLoading} onChange={(e) => {setInputText(e.target.value);setDraft(null);}}
            className="w-full h-72 p-3 text-[13px] border border-[var(--line)] rounded-[8px] font-sans focus:outline-none focus:border-[var(--green)] resize-none"
            placeholder="Type or paste doctor discharge orders here..."
          />
        </div>

        {/* Right Column: Plain Language Translation */}
        <div className="bg-white p-6 rounded-[12px] border border-[var(--line)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">
              Patient Guidance: {SUPPORTED_LANGUAGES_MAP[targetLang]}
            </h3>
            <Badge variant={draft ? (isAttested ? "verified" : "unverified") : "default"}>
              {draft ? (isAttested ? "Clinician Attested" : "Awaiting Attestation") : "Standby"}
            </Badge>
          </div>

          {!draft ? (
            <EmptyState
              icon={<HeartHandshake className="w-8 h-8" />}
              title="Translation Output Standby"
              description="Click 'Translate & Simplify (Gemini)' to generate patient-accessible guidance in your selected target language."
            />
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-[#faf9f5] rounded-[8px] border border-[var(--line)] text-[14px] leading-relaxed whitespace-pre-wrap text-[var(--ink)]">
                {draft.translatedInstructions}
              </div>

              {/* Medication Preservation Callouts */}
              {draft.validatedMedications.length > 0 && (
                <div className="p-3 bg-white rounded-[8px] border border-[var(--line)] space-y-2">
                  <div className="text-[12px] font-bold text-[var(--ink)] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[var(--green)]" />
                    <span>Preserved Medication Parameters:</span>
                  </div>
                  <div className="space-y-1">
                    {draft.validatedMedications.map((m, idx) => (
                      <div key={idx} className="text-[11px] p-2 bg-[#f4f7f4] rounded flex items-center justify-between">
                        <span className="font-mono text-[var(--ink)]">{m.original}</span>
                        <span className="text-[var(--green)] font-semibold">Requires clinician comparison</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning Signs */}
              {draft.warningSymptoms.length > 0 && (
                <div className="p-3 bg-[#fdf2f2] rounded-[8px] border border-[#f5c6c6] text-[12px] space-y-1">
                  <div className="font-bold text-[#991b1b] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Critical Warning Signs (Emergency Protocols):</span>
                  </div>
                  <ul className="m-0 pl-4 text-[#991b1b]">
                    {draft.warningSymptoms.map((sym, idx) => (
                      <li key={idx}>{sym}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clinician Attestation Control */}
              <div className="pt-2">
                <Button
                  variant={isAttested ? "outline" : "primary"}
                  className="w-full"
                  disabled={isAttested}
                  onClick={async () => {
                    const rationale = window.prompt("After comparing the source and translation, record your review of medication names, doses and instructions.");
                    if (!rationale?.trim()) return;
                    try { await approveDischarge(draft.id,rationale); setIsAttested(true); await refresh(); }
                    catch { window.alert("Approval could not be saved."); }
                  }}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  {isAttested ? "✓ Clinical Attestation Recorded" : "Attest & Approve for Patient Delivery"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Health Literacy Safeguards */}
      <section className="tile">
        <span className="num">SAFETY SAFEGUARD</span>
        <h3 className="text-[18px] font-[650] my-2">Clinician Attestation Required Before Patient Delivery</h3>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed my-0">
          Machine translations of medical guidance are strictly provisional. Hospital staff or a licensed clinical provider must examine and verify the translated guidance prior to delivering paperwork to the patient.
        </p>
      </section>
    </>
  );
}
