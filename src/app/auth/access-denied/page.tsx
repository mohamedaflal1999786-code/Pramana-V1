import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Access Denied — Pramana-V1",
  description: "Unauthorized access or insufficient permissions.",
};

export default function AccessDeniedPage() {
  return (
    <AuthLayout
      eyebrow="Access Control Notice"
      title="Access Restricted"
      subtitle="Your current role does not possess permissions to view this clinical document or workspace."
    >
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-[#fbebeb] text-[#991b1b] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0 mb-2">
          Insufficient Role Privileges
        </h3>

        <p className="text-[14px] text-[var(--muted)] leading-relaxed mb-6">
          Under strict healthcare data governance standards, clinical records and provenance graphs are segregated by institutional ward and role privilege.
        </p>

        <div className="p-4 rounded-[8px] bg-[#fdf2f2] border border-[#f5c6c6] text-left text-[12px] text-[#991b1b] mb-6">
          <strong>Security Notice:</strong> Attempted access to restricted patient safety workspaces is recorded in the immutable institutional compliance log.
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/platform">
            <Button variant="primary" className="w-full">
              Return to Authorized Overview →
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" className="w-full">
              Request Role Elevation
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
