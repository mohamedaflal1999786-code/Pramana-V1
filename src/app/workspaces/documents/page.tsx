"use client";

import * as React from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { FileText, UploadCloud, Search, Eye, ShieldCheck, CheckCircle } from "lucide-react";

export default function DocumentIntelligencePage() {
  const [activeTab, setActiveTab] = React.useState<"upload" | "extracted">("upload");

  return (
    <WorkspaceLayout pageTitle="Document Intelligence">
      <PageHeader
        eyebrow="Clinical Document Intelligence"
        title="Multi-Source Ingestion & Extraction"
        description="Ingest unstructured clinical notes, lab reports, transfer summaries, and prescriptions while preserving immutable source provenance."
      />

      {/* Tabs */}
      <div className="flex border-b border-[var(--line)] gap-6">
        <button
          onClick={() => setActiveTab("upload")}
          className={`pb-3 text-[14px] font-[650] border-b-2 transition-colors cursor-pointer ${
            activeTab === "upload"
              ? "border-[var(--green)] text-[var(--green)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          1. Ingest Documents
        </button>
        <button
          onClick={() => setActiveTab("extracted")}
          className={`pb-3 text-[14px] font-[650] border-b-2 transition-colors cursor-pointer ${
            activeTab === "extracted"
              ? "border-[var(--green)] text-[var(--green)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          2. Extracted Entities & Tokens
        </button>
      </div>

      {activeTab === "upload" ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[12px] border border-[var(--line)]">
            <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0 mb-2">
              Ingest Encounter Documentation
            </h3>
            <p className="text-[13px] text-[var(--muted)] my-0 mb-4 leading-relaxed">
              Files are processed in memory and encrypted for your institutional tenancy. Original files are never modified, ensuring cryptographic auditability.
            </p>
            <FileUpload />
          </div>

          <div className="bg-white p-6 rounded-[12px] border border-[var(--line)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] mb-4">
              <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">
                Session Document Inventory
              </h3>
              <Badge variant="unverified">0 Files Staged</Badge>
            </div>

            <EmptyState
              icon={<FileText className="w-8 h-8" />}
              title="No Documents Uploaded in Current Session"
              description="Drop clinical files into the zone above to view document hashes, processing status, and extracted text segments."
            />
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-[12px] border border-[var(--line)]">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] mb-4">
            <div>
              <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0">
                Token-Grounded Entities
              </h3>
              <p className="text-[13px] text-[var(--muted)] my-0">
                Structured clinical terms linked to exact source document coordinates.
              </p>
            </div>
            <Badge variant="default">Awaiting Ingestion</Badge>
          </div>

          <EmptyState
            icon={<Search className="w-8 h-8" />}
            title="Entity Extraction Pipeline Standby"
            description="Once documents are uploaded, extracted entities (medications, dosages, allergies, lab values) will appear here with token confidence ratings."
          />
        </div>
      )}
    </WorkspaceLayout>
  );
}
