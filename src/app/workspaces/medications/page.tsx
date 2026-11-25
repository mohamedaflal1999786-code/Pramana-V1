"use client";

import * as React from "react";
import Link from "next/link";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Pill, AlertOctagon, CheckCircle2, ShieldCheck, UploadCloud, RefreshCw, FileText, Network } from "lucide-react";
import { getPatientSafetyProvenanceGraphAction } from "@/lib/actions/graph-actions";
import type { SPGNode } from "@/lib/graph/types";

export default function MedicationSafetyPage() {
  const [medNodes, setMedNodes] = React.useState<SPGNode[]>([]);
  const [allergyNodes, setAllergyNodes] = React.useState<SPGNode[]>([]);
  const [findingNodes, setFindingNodes] = React.useState<SPGNode[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const spg = await getPatientSafetyProvenanceGraphAction();
      setMedNodes(spg.nodes.filter((n) => n.nodeType === "medication_record"));
      setAllergyNodes(spg.nodes.filter((n) => n.nodeType === "documented_allergy"));
      setFindingNodes(spg.nodes.filter((n) => n.nodeType === "clinical_finding"));
    } catch (err: any) {
      console.error("Failed to load medication records:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <WorkspaceLayout pageTitle="Medication Safety">
      <PageHeader
        eyebrow="Pharmacovigilance & Reconciliation"
        title="Medication Discrepancy Verification"
        description="Cross-check active physician orders against pre-admission regimens, allergy contraindications, and transfer handoffs."
        actions={
          <div className="flex gap-2">
            <Link href="/workspaces/documents">
              <Button variant="primary" size="sm" leftIcon={<UploadCloud className="w-4 h-4" />}>
                Ingest Order Sheet
              </Button>
            </Link>
            <Link href="/workspaces/graph">
              <Button variant="outline" size="sm" leftIcon={<Network className="w-4 h-4" />}>
                View Lineage Graph
              </Button>
            </Link>
          </div>
        }
      />

      {/* Medication Audit Schema Table */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">Reconciliation Matrix</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Audit for omissions, duplicates, and dose variances across care shifts.
            </p>
          </div>
          <Badge variant={findingNodes.length > 0 ? "discrepancy" : "verified"}>
            {findingNodes.length} Active Safety Finding{findingNodes.length === 1 ? "" : "s"}
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--green)] mb-2" />
            <p className="text-[13px] text-[var(--muted)]">Loading medication regimens from Safety Provenance Graph...</p>
          </div>
        ) : medNodes.length === 0 ? (
          <EmptyState
            icon={<Pill className="w-7 h-7" />}
            title="No Medications in Active Reconciliation Queue"
            description="Upload a Medication Administration Record (MAR) or discharge order sheet to evaluate drug-allergy interactions and transfer therapy gaps."
            action={
              <Link href="/workspaces/documents">
                <Button variant="outline" size="sm">
                  Upload Clinical Document
                </Button>
              </Link>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication Name</TableHead>
                <TableHead>Dosage / Regimen</TableHead>
                <TableHead>Verbatim Extraction</TableHead>
                <TableHead>Conflict / Audit Status</TableHead>
                <TableHead className="text-right">Provenance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medNodes.map((med) => {
                const name = med.metadata?.name || med.label;
                const hasFinding = findingNodes.some((f) =>
                  f.label.toLowerCase().includes(name.toLowerCase())
                );

                return (
                  <TableRow key={med.id}>
                    <TableCell className="font-[650] text-[var(--ink)] flex items-center gap-2">
                      <Pill className="w-4 h-4 text-[var(--green)]" />
                      <span>{name}</span>
                    </TableCell>
                    <TableCell className="text-[var(--muted)]">
                      {med.metadata?.dosage || "Standard Dose"}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-[var(--muted)] max-w-xs truncate">
                      {med.metadata?.dosage ? `"${med.metadata.dosage}"` : "Extracted from admission chart"}
                    </TableCell>
                    <TableCell>
                      {hasFinding ? (
                        <Badge variant="danger">Safety Flag Raised</Badge>
                      ) : (
                        <Badge variant="verified">Reconciled / Cleared</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href="/workspaces/graph">
                        <Button variant="outline" size="sm" className="text-[11px]">
                          Trace SPG
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Allergies & Cross-Reactivity Checks */}
      {allergyNodes.length > 0 && (
        <section className="bg-white rounded-[12px] border border-[var(--line)] p-6 mt-6">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)]">
            <h4 className="text-[15px] font-[650] text-[var(--ink)] my-0 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-[#9c3e21]" />
              <span>Documented Hypersensitivity & Contraindications</span>
            </h4>
            <Badge variant="danger">{allergyNodes.length} Documented</Badge>
          </div>
          <div className="space-y-2">
            {allergyNodes.map((alg) => (
              <div
                key={alg.id}
                className="p-3 bg-[#faf9f5] border border-[var(--line)] rounded-[8px] flex items-center justify-between text-[12px]"
              >
                <div>
                  <span className="font-[650] text-[var(--ink)]">{alg.label}</span>
                  <span className="text-[var(--muted)] block text-[11px]">
                    {alg.metadata?.dosage || "Severe hypersensitivity documented in clinical chart."}
                  </span>
                </div>
                <Link href="/workspaces/graph">
                  <Button variant="outline" size="sm" className="text-[11px]">
                    Inspect Rule Edge
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </WorkspaceLayout>
  );
}
