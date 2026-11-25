"use client";

import * as React from "react";
import Link from "next/link";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import {
  ShieldCheck,
  Users,
  Key,
  Server,
  Lock,
  Database,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import { getSupabaseConfigStatus, SupabaseConfigStatus } from "@/lib/supabase/status";
import {
  listInstitutionalAccountsAction,
  approveAccountAction,
  suspendAccountAction,
  type PendingAccountItem,
} from "@/lib/auth/admin-actions";

export default function AdminWorkspacePage() {
  const [configStatus, setConfigStatus] = React.useState<SupabaseConfigStatus | null>(null);
  const [accounts, setAccounts] = React.useState<PendingAccountItem[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = React.useState(true);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);

  const fetchAccounts = React.useCallback(async () => {
    setIsLoadingAccounts(true);
    try {
      const data = await listInstitutionalAccountsAction();
      setAccounts(data);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  React.useEffect(() => {
    setConfigStatus(getSupabaseConfigStatus());
    fetchAccounts();
  }, [fetchAccounts]);

  const handleApprove = async (userId: string) => {
    const res = await approveAccountAction(userId);
    if (res.success) {
      setActionMessage("Account approved successfully.");
      await fetchAccounts();
    } else {
      setActionMessage(`Approval failed: ${res.error}`);
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSuspend = async (userId: string) => {
    const res = await suspendAccountAction(userId, "Administrative suspension");
    if (res.success) {
      setActionMessage("Account suspended.");
      await fetchAccounts();
    } else {
      setActionMessage(`Suspension failed: ${res.error}`);
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

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

      {actionMessage && (
        <div className="p-3 text-[13px] text-[#145a45] bg-[#e5f1df] border border-[#c3d8c8] rounded-[7px] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Tenancy & Security Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[12px] bg-white border border-[var(--line)]">
          <span className="text-[11px] font-[750] tracking-[1.4px] text-[var(--green)] uppercase block mb-2">
            INSTITUTIONAL TENANT
          </span>
          <h3 className="text-[20px] font-[650] text-[var(--ink)] my-0 mb-1">
            Pramana Academic Health System
          </h3>
          <p className="text-[13px] text-[var(--muted)] my-0">
            Tenant ID: <span className="font-mono text-[var(--ink)]">00000000-0000-0000-0000-000000000001</span>
          </p>
          <div className="mt-4 pt-4 border-t border-[var(--line)] flex items-center justify-between">
            <Badge variant="verified">Isolated Tenancy Active</Badge>
            <span className="text-[12px] text-[var(--muted)]">Tier: Pilot Research</span>
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
            <span className="text-[12px] text-[var(--muted)]">26 Schema Tables</span>
          </div>
        </div>

        <div className="p-6 rounded-[12px] bg-white border border-[var(--line)]">
          <span className="text-[11px] font-[750] tracking-[1.4px] text-[var(--green)] uppercase block mb-2">
            AUDIT LOG INTEGRITY
          </span>
          <h3 className="text-[20px] font-[650] text-[var(--ink)] my-0 mb-1">
            Append-Only Audit Ledger
          </h3>
          <p className="text-[13px] text-[var(--muted)] my-0">
            Table: <span className="font-mono text-[var(--ink)]">public.audit_logs</span>
          </p>
          <div className="mt-4 pt-4 border-t border-[var(--line)] flex items-center justify-between">
            <Badge variant="default">Append-Only Active</Badge>
            <span className="text-[12px] text-[var(--muted)]">RLS Enforced</span>
          </div>
        </div>
      </div>

      {/* Authorized Institutional Clinicians & Pending Approvals */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0">
              Institutional User Directory & Account Approvals
            </h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Healthcare professionals and clinicians registered under this institutional tenant.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAccounts}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingAccounts ? "animate-spin" : ""}`} />}
          >
            Refresh Roster
          </Button>
        </div>

        {accounts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clinician / User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell>
                    <div className="font-semibold text-[var(--ink)]">{acc.fullName}</div>
                    <div className="text-[12px] text-[var(--muted)]">{acc.email}</div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize font-semibold text-[13px]">{acc.requestedRole.replace("_", " ")}</span>
                  </TableCell>
                  <TableCell className="text-[var(--muted)]">{acc.department || "Clinical Staff"}</TableCell>
                  <TableCell>
                    {acc.isActive ? (
                      <Badge variant="verified">Approved</Badge>
                    ) : (
                      <Badge variant="pending">Pending Approval</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {!acc.isActive ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApprove(acc.userId)}
                        leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSuspend(acc.userId)}
                        leftIcon={<UserX className="w-3.5 h-3.5" />}
                      >
                        Suspend
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center text-[13px] text-[var(--muted)]">
            {isLoadingAccounts ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[var(--green)]" />
                <span>Loading institutional roster...</span>
              </div>
            ) : (
              <div>
                <p className="my-0">No other users have registered under this tenant yet.</p>
                <p className="text-[12px] mt-1 text-[var(--muted)]">
                  Clinicians can register at <Link href="/auth/signup" className="text-[var(--green)] underline">/auth/signup</Link> and their approval requests will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Database Schema & Migration Registry */}
      <section className="bg-white rounded-[12px] border border-[var(--line)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0">Database Schema & RLS Architecture</h3>
            <p className="text-[13px] text-[var(--muted)] my-0">
              Version-controlled SQL migrations structured with strict Row Level Security.
            </p>
          </div>
          <Badge variant="verified">26 Live Tables Active</Badge>
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
    </WorkspaceLayout>
  );
}
