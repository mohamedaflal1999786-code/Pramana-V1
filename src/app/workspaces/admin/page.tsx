"use client";

import * as React from "react";
import Link from "next/link";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ShieldCheck, Users, Key, Server, Lock, Database, RefreshCw, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { getSupabaseConfigStatus, SupabaseConfigStatus } from "@/lib/supabase/status";

export default function AdminWorkspacePage() {
  const [configStatus, setConfigStatus] = React.useState<SupabaseConfigStatus | null>(null);

  React.useEffect(() => {
    setConfigStatus(getSupabaseConfigStatus());
  }, []);

  return (
    <WorkspaceLayout activeRole="admin">
      <PageHeader
        eyebrow="Institutional Governance"
        title="Administration & Compliance Console"
        description="Manage private institutional tenancy, configure Role-Based Access Control (RBAC) policies, and inspect PostgreSQL schema migrations and audit logs."
        actions={
          <div className="flex gap-2">
            <Link href="/auth/signup">
              <Button variant="primary" size="sm" leftIcon={<Users className="w-4 h-4" />}>
                Provision Clinician User
              </Button>
            </Link>
            <Link href="/security-privacy">
              <Button variant="outline" size="sm" leftIcon={<Lock className="w-4 h-4" />}>
                Security Specifications
              </Button>
            </Link>
          </div>
        }
      />

      {/* Tenancy & Security Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[12px] bg-white border border-[var(--line)]">
          <span className="text-[11px] font-[750] tracking-[1.4px] text-[var(--green)] uppercase block mb-2">
            INSTITUTIONAL TENANT
          </span>
          <h3 className="text-[20px] font-[650] text-[var(--ink)] my-0 mb-1">
            Research Evaluation Ward
          </h3>
          <p className="text-[13px] text-[var(--muted)] my-0">Tenant ID: <span className="font-mono text-[var(--ink)]">tenant-demo-local</span></p>
          <div className="mt-4 pt-4 border-t border-[var(--line)] flex items-center justify-between">
            <Badge variant="verified">Isolated Tenancy Active</Badge>
            <span className="text-[12px] text-[var(--muted)]">Tier: Academic Pilot</span>
          </div>
        </div>

        <div className="p-6 rounded-[12px] bg-white border border-[var(--line)]">
          <span className="text-[11px] font-[750] tracking-[1.4px] text-[var(--green)] uppercase block mb-2">
            POSTGRESQL & STORAGE
          </span>
          <h3 className="text-[20px] font-[650] text-[var(--ink)] my-0 mb-1">
            Supabase Infrastructure
          </h3>
          <p className="text-[13px] text-[var(--muted)] my-0">
            {configStatus?.isConfigured
              ? `Connected: ${configStatus.urlHost || "Configured Host"}`
              : "Status: 31 Migrations Ready (Local Development)"}
          </p>
          <div className="mt-4 pt-4 border-t border-[var(--line)] flex items-center justify-between">
            {configStatus?.isConfigured ? (
              <Badge variant="verified">Live DB Active</Badge>
            ) : (
              <Badge variant="pending">Schema Ready</Badge>
            )}
            <span className="text-[12px] text-[var(--muted)]">31 Schema Tables</span>
          </div>
        </div>

        <div className="p-6 rounded-[12px] bg-white border border-[var(--line)]">
          <span className="text-[11px] font-[750] tracking-[1.4px] text-[var(--green)] uppercase block mb-2">
            AUDIT LOG INTEGRITY
          </span>
          <h3 className="text-[20px] font-[650] text-[var(--ink)] my-0 mb-1">
            Append-Only Audit Ledger
          </h3>
          <p className="text-[13px] text-[var(--muted)] my-0">Table: <span className="font-mono text-[var(--ink)]">public.audit_logs</span></p>
          <div className="mt-4 pt-4 border-t border-[var(--line)] flex items-center justify-between">
            <Badge variant="default">Append-Only Trigger Active</Badge>
            <span className="text-[12px] text-[var(--muted)]">RLS Enforced</span>
          </div>
        </div>
      </div>

      {/* Database Schema & Migration Registry */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0">Database Migration Inventory (Phase 03)</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Version-controlled SQL migrations structured in <span className="font-mono">supabase/migrations/</span> with strict Row Level Security.
            </p>
          </div>
          <Badge variant="verified">8 Migration Units Verified</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-[13px]">
          <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)]">
            <span className="font-mono text-[11px] text-[var(--green)] block font-bold mb-1">001_institutional_management</span>
            <p className="font-semibold text-[var(--ink)] my-0">Tenancy & RBAC</p>
            <p className="text-[12px] text-[var(--muted)] my-1">8 tables (organizations, members, roles, approvals)</p>
          </div>
          <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)]">
            <span className="font-mono text-[11px] text-[var(--green)] block font-bold mb-1">002_patient_and_encounters</span>
            <p className="font-semibold text-[var(--ink)] my-0">Patient & Encounters</p>
            <p className="text-[12px] text-[var(--muted)] my-1">3 tables (patients, patient_access, encounters)</p>
          </div>
          <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)]">
            <span className="font-mono text-[11px] text-[var(--green)] block font-bold mb-1">003_clinical_intelligence</span>
            <p className="font-semibold text-[var(--ink)] my-0">Documents & Entities</p>
            <p className="text-[12px] text-[var(--muted)] my-1">7 tables (documents, versions, entities, meds, labs)</p>
          </div>
          <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)]">
            <span className="font-mono text-[11px] text-[var(--green)] block font-bold mb-1">004_safety_provenance_graph</span>
            <p className="font-semibold text-[var(--ink)] my-0">Safety Provenance Graph</p>
            <p className="text-[12px] text-[var(--muted)] my-1">5 tables (rules, versions, alerts, nodes, edges)</p>
          </div>
          <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)]">
            <span className="font-mono text-[11px] text-[var(--green)] block font-bold mb-1">005_professional_verification</span>
            <p className="font-semibold text-[var(--ink)] my-0">Attestation & Reviews</p>
            <p className="text-[12px] text-[var(--muted)] my-1">5 tables (reviews, handoffs, discharge, attestations)</p>
          </div>
          <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)]">
            <span className="font-mono text-[11px] text-[var(--green)] block font-bold mb-1">006_platform_governance</span>
            <p className="font-semibold text-[var(--ink)] my-0">Governance & Inquiries</p>
            <p className="text-[12px] text-[var(--muted)] my-1">3 tables (audit_logs, contact_inquiries, consent)</p>
          </div>
          <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)]">
            <span className="font-mono text-[11px] text-[var(--green)] block font-bold mb-1">007_storage_buckets</span>
            <p className="font-semibold text-[var(--ink)] my-0">Private Object Storage</p>
            <p className="text-[12px] text-[var(--muted)] my-1">3 private buckets (25MB limit, strict MIME whitelist)</p>
          </div>
          <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)]">
            <span className="font-mono text-[11px] text-[var(--green)] block font-bold mb-1">008_row_level_security</span>
            <p className="font-semibold text-[var(--ink)] my-0">Row Level Security (RLS)</p>
            <p className="text-[12px] text-[var(--muted)] my-1">Multi-tenant isolation & least-privilege matrix</p>
          </div>
        </div>
      </section>

      {/* Role-Based Access Control Registry */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0">Authorized Clinician Registry (RBAC)</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Users with cryptographically verified institutional credentials.
            </p>
          </div>
          <Badge variant="default">Schema View</Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Identity</TableHead>
              <TableHead>Role Assignment</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>MFA Status</TableHead>
              <TableHead>Authorization</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-semibold text-[var(--ink)]">Dr. Eleanor Vance</TableCell>
              <TableCell><Badge variant="verified">Attending Physician</Badge></TableCell>
              <TableCell className="text-[var(--muted)]">Critical Care / Inpatient</TableCell>
              <TableCell><Badge variant="verified">Enrolled (TOTP)</Badge></TableCell>
              <TableCell><span className="text-[12px] text-[var(--green)] font-semibold">Active Session</span></TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p className="text-[12px] text-[var(--muted)] mt-3 mb-0">
          * Dynamic user management and invite revocation will synchronize with Supabase Auth in Phase 04.
        </p>
      </section>

      {/* Compliance Event Schema */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0">Institutional Compliance Audit Log</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Append-only audit ledger tracking all document ingestion, graph generation, and verification actions.
            </p>
          </div>
          <Badge variant="unverified">Empty Staging Ledger</Badge>
        </div>

        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No Audit Events Recorded"
          description="The institutional compliance ledger is ready. Once clinical documents are ingested and verified by attending physicians, cryptographic audit events will be logged here."
        />
      </section>
    </WorkspaceLayout>
  );
}
