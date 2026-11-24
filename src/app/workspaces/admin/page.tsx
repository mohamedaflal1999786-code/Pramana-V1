"use client";

import * as React from "react";
import Link from "next/link";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ShieldCheck, Users, Key, Server, Lock, Database, RefreshCw, FileText } from "lucide-react";

export default function AdminWorkspacePage() {
  return (
    <WorkspaceLayout activeRole="admin">
      <PageHeader
        eyebrow="Institutional Governance"
        title="Administration & Compliance Console"
        description="Manage private institutional tenancy, configure Role-Based Access Control (RBAC) policies, and audit cryptographic compliance logs."
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
          <div className="mt-4 pt-4 border-t border-[var(--line)]">
            <Badge variant="verified">Isolated Schema Active</Badge>
          </div>
        </div>

        <div className="p-6 rounded-[12px] bg-white border border-[var(--line)]">
          <span className="text-[11px] font-[750] tracking-[1.4px] text-[var(--green)] uppercase block mb-2">
            DATABASE INTEGRATION
          </span>
          <h3 className="text-[20px] font-[650] text-[var(--ink)] my-0 mb-1">
            Supabase Staging
          </h3>
          <p className="text-[13px] text-[var(--muted)] my-0">Target: PostgreSQL + Row-Level Security</p>
          <div className="mt-4 pt-4 border-t border-[var(--line)] flex gap-2">
            <Badge variant="pending">Prepared for Phase 03</Badge>
          </div>
        </div>

        <div className="p-6 rounded-[12px] bg-white border border-[var(--line)]">
          <span className="text-[11px] font-[750] tracking-[1.4px] text-[var(--green)] uppercase block mb-2">
            AUDIT LOG INTEGRITY
          </span>
          <h3 className="text-[20px] font-[650] text-[var(--ink)] my-0 mb-1">
            Immutable Event Log
          </h3>
          <p className="text-[13px] text-[var(--muted)] my-0">Status: Standby for ingestion</p>
          <div className="mt-4 pt-4 border-t border-[var(--line)]">
            <Badge variant="default">0 Events Logged</Badge>
          </div>
        </div>
      </div>

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
          * Dynamic user management and invite revocation will synchronize with Supabase Auth in Phase 03.
        </p>
      </section>

      {/* Compliance Event Schema */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0">Institutional Compliance Audit Log</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Cryptographic ledger tracking all document ingestion, graph generation, and verification actions.
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
