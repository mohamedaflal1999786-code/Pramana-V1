"use client";

import * as React from "react";
import Link from "next/link";
import { CareForm } from "@/components/workspace/CareForm";
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
  const [panel, setPanel] = React.useState<"registration" | "security" | null>(null);
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
      <CareForm mode="assign"/>
      <PageHeader
        eyebrow="Institutional Governance"
        title="Administration & Compliance Console"
        description="Manage registered users, review access requests and maintain institutional account permissions."
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="primary" size="sm" onClick={()=>setPanel(p=>p==="registration"?null:"registration")} leftIcon={<Users className="w-4 h-4" />}>Registration page</Button>
            <Button type="button" variant="outline" size="sm" onClick={()=>setPanel(p=>p==="security"?null:"security")} leftIcon={<Lock className="w-4 h-4" />}>Security Specifications</Button>
          </div>
        }
      />

      {panel && <section className="rounded-xl border border-[var(--line)] p-5 space-y-3">
        <div className="flex justify-between items-center"><h2 className="text-lg font-semibold">{panel==="registration"?"User registration":"Security specifications"}</h2><Button type="button" variant="outline" size="sm" onClick={()=>setPanel(null)}>Close</Button></div>
        {panel==="registration"? <><p>Share this public registration address with new users. They must register in their own browser session, verify their email and await administrator approval.</p><input aria-label="Registration address" readOnly value="https://pramana-v1.vercel.app/auth/signup" className="w-full border rounded p-2" onFocus={e=>e.target.select()}/><Button type="button" onClick={async()=>{try{await navigator.clipboard.writeText("https://pramana-v1.vercel.app/auth/signup");setActionMessage("Registration address copied.");}catch{setActionMessage("Select and copy the registration address manually.");}}}>Copy registration link</Button></>:<><a className="underline" href="/auth/mfa">Manage two-factor authentication</a><p>Workspace access requires a verified account and active organization membership. Role checks are enforced by server layouts.</p><p>Clinical privacy, patient-level access and external AI data handling require further validation before real patient use. No compliance certification is claimed.</p><a href="/security-privacy" target="_blank" rel="noopener noreferrer" className="underline text-[var(--green)]">Read full security design goals (new tab)</a></>}
      </section>}
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
                    <div className="text-[12px] text-[var(--muted)]">{acc.email}</div><small className="break-all">Account ID · {acc.userId}</small>
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
                  Clinicians can register at <button type="button" onClick={()=>setPanel("registration")} className="text-[var(--green)] underline">the registration address</button> and their approval requests will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

    </WorkspaceLayout>
  );
}
