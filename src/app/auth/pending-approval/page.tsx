import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Clock, ShieldCheck, Mail } from "lucide-react";

export const metadata = {
  title: "Pending Approval — Pramana-V1",
  description: "Account pending institutional administrative review and credential verification.",
};

export default function PendingApprovalPage() {
  return (
    <AuthLayout
      eyebrow="Institutional Governance"
      title="Verification in Progress"
      subtitle="Your registration has been submitted and is pending institutional clearance."
    >
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-[#fbf4e8] text-[#8c591c] flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7" />
        </div>

        <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0 mb-2">
          Institutional Security Hold
        </h3>

        <p className="text-[14px] text-[var(--muted)] leading-relaxed mb-6">
          In adherence to healthcare patient privacy regulations, clinical document access requires manual approval by your hospital or research department&apos;s designated Patient Safety Officer.
        </p>

        <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)] text-left text-[13px] space-y-2 mb-6">
          <div className="flex items-center gap-2 text-[var(--ink)] font-[650]">
            <ShieldCheck className="w-4 h-4 text-[var(--green)]" />
            <span>Audit Steps in Progress:</span>
          </div>
          <ul className="list-disc list-inside text-[var(--muted)] space-y-1 pl-1">
            <li>Validation of institutional clinical domain credentials</li>
            <li>Role-Based Access Control (RBAC) role assignment</li>
            <li>Audit log provisioning & private tenancy configuration</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/auth/signin">
            <Button variant="outline" className="w-full">
              Sign Out / Switch Account
            </Button>
          </Link>
          <Link href="/contact" className="text-[12px] text-[var(--muted)] hover:text-[var(--ink)]">
            Expedite with Institutional Review Board (IRB) →
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
