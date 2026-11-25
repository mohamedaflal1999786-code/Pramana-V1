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
    if (!window.confirm("Suspend access for this account?")) return;
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
        description="Manage registered users, review access requests and maintain institutional account permissions."
        actions={
          <div className="flex gap-2">
            <Link href="/auth/signup">
              <Button variant="primary" size="sm" leftIcon={<Users className="w-4 h-4" />}>
                Registration page
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[["Registered accounts",accounts.length],["Active accounts",accounts.filter(a=>a.isActive).length],["Inactive / awaiting review",accounts.filter(a=>!a.isActive).length]].map(([label,value])=><div key={label} className="p-5 rounded-xl bg-white border border-[var(--line)]"><p className="text-sm text-[var(--muted)]">{label}</p><div className="text-3xl font-semibold">{isLoadingAccounts?"—":value}</div></div>)}
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
                      <Badge variant="pending">Inactive / pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {["platform_admin","institutional_admin"].includes(acc.requestedRole) ? <span className="text-xs text-[var(--muted)]">Protected account</span> : !acc.isActive ? (
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

    </WorkspaceLayout>
  );
}
