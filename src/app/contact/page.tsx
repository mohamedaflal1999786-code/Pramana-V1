"use client";

import * as React from "react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Mail, Building2, User, Info, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = React.useState({
    fullName: "",
    email: "",
    institution: "",
    role: "Clinical Investigator",
    inquiryType: "pilot_inquiry",
    message: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionResult, setSubmissionResult] = React.useState<{
    success: boolean;
    persisted: boolean;
    inquiryId?: string;
    message: string;
  } | null>(null);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = "Please enter your full name.";
    if (!formData.email.trim() || !formData.email.includes("@")) {
      errs.email = "Please enter a valid institutional email address.";
    }
    if (!formData.institution.trim()) errs.institution = "Please specify your institution or health system.";
    if (!formData.message.trim() || formData.message.length < 15) {
      errs.message = "Please provide details regarding your inquiry (minimum 15 characters).";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionResult(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmissionResult({
          success: false,
          persisted: false,
          message: data.message || "Failed to submit inquiry. Please review your entries.",
        });
        if (data.errors && data.errors.length > 0) {
          setErrors({ api: data.errors.join(". ") });
        }
      } else {
        setSubmissionResult({
          success: true,
          persisted: Boolean(data.persisted),
          inquiryId: data.inquiryId,
          message: data.message,
        });
        // Clear form on confirmed successful submission
        setFormData({
          fullName: "",
          email: "",
          institution: "",
          role: "Clinical Investigator",
          inquiryType: "pilot_inquiry",
          message: "",
        });
        setErrors({});
      }
    } catch (err: unknown) {
      setSubmissionResult({
        success: false,
        persisted: false,
        message: "Network error connecting to /api/contact endpoint.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="wrap py-12">
        <Breadcrumbs items={[{ label: "Contact" }]} className="mb-6" />

        <PageHeader
          eyebrow="Institutional Inquiries"
          title={
            <>
              Connect with the <span className="font-serif font-normal italic text-[var(--green)]">Research Team.</span>
            </>
          }
          description="We welcome collaboration with healthcare systems, clinical trial groups, academic medical centers, and patient safety investigators."
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-start mb-16">
          <div className="space-y-6">
            <div className="p-4 rounded-[8px] bg-[#faf9f5] border border-[var(--line)] flex items-start gap-3 text-[13px] text-[var(--muted)]">
              <Info className="w-5 h-5 text-[var(--green)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--ink)] block mb-0.5">Phase 03 Server-Side Persistence</strong>
                Inquiries submitted below are validated on the server and persisted to the PostgreSQL <span className="font-mono text-[var(--ink)] font-semibold">contact_inquiries</span> table. For patient safety, Protected Health Information (PHI) is rejected by automated validation.
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 rounded-[12px] bg-white border border-[var(--line)] space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Full Name"
                  placeholder="Dr. Jordan Mercer"
                  leftIcon={<User className="w-4 h-4" />}
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    setSubmissionResult(null);
                  }}
                  error={errors.fullName}
                  required
                />
                <Input
                  label="Institutional Email"
                  type="email"
                  placeholder="j.mercer@hospital.org"
                  leftIcon={<Mail className="w-4 h-4" />}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setSubmissionResult(null);
                  }}
                  error={errors.email}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Institution / Health System"
                  placeholder="Academic Medical Center"
                  leftIcon={<Building2 className="w-4 h-4" />}
                  value={formData.institution}
                  onChange={(e) => {
                    setFormData({ ...formData, institution: e.target.value });
                    setSubmissionResult(null);
                  }}
                  error={errors.institution}
                  required
                />
                <Select
                  label="Primary Role"
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value });
                    setSubmissionResult(null);
                  }}
                  options={[
                    { value: "Clinical Investigator", label: "Clinical Investigator" },
                    { value: "Safety / Quality Officer", label: "Safety / Quality Officer" },
                    { value: "Health System Executive", label: "Health System Executive" },
                    { value: "Clinical Informatics Specialist", label: "Clinical Informatics Specialist" },
                    { value: "Academic Researcher", label: "Academic Researcher" },
                  ]}
                />
              </div>

              <Select
                label="Nature of Inquiry"
                value={formData.inquiryType}
                onChange={(e) => {
                  setFormData({ ...formData, inquiryType: e.target.value });
                  setSubmissionResult(null);
                }}
                options={[
                  { value: "pilot_inquiry", label: "Research Collaboration & Pilot Study" },
                  { value: "security_audit", label: "Security & Compliance Evaluation" },
                  { value: "research_collaboration", label: "Clinical Trial Integration Inquiry" },
                  { value: "general", label: "General Academic Inquiry" },
                ]}
              />

              <div>
                <label className="block text-[13px] font-[650] text-[var(--ink)] mb-[6px]">
                  Inquiry Details
                </label>
                <textarea
                  rows={5}
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    setSubmissionResult(null);
                  }}
                  placeholder="Please describe your clinical focus, trial parameters, or questions regarding Pramana-V1's provenance architecture (do not include patient PHI)..."
                  className="w-full bg-white text-[var(--ink)] text-[14px] placeholder:text-[#889b91] border border-[var(--line)] rounded-[7px] py-[12px] px-[14px] focus:border-[var(--green)] focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
                />
                {errors.message && (
                  <p className="text-[12px] text-[#b91c1c] mt-[5px]">{errors.message}</p>
                )}
                {errors.api && (
                  <p className="text-[12px] text-[#b91c1c] mt-[5px] font-medium">{errors.api}</p>
                )}
              </div>

              {submissionResult && (
                <div
                  className={`p-4 rounded-[7px] border flex items-start gap-3 text-[13px] ${
                    submissionResult.success
                      ? "bg-[#eef6ec] border-[#b9d6c4] text-[#145a45]"
                      : "bg-[#fef2f2] border-[#fecaca] text-[#991b1b]"
                  }`}
                >
                  {submissionResult.success ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#145a45]" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#991b1b]" />
                  )}
                  <div>
                    <strong>
                      {submissionResult.success ? "Submission Confirmed: " : "Submission Blocked: "}
                    </strong>
                    {submissionResult.message}
                    {submissionResult.inquiryId && (
                      <div className="mt-1 font-mono text-[11px] opacity-80">
                        Record ID: {submissionResult.inquiryId}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Persisting Inquiry...
                    </>
                  ) : (
                    "Submit Institutional Inquiry →"
                  )}
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="tile">
              <span className="num">COORDINATION</span>
              <h3 className="text-[18px] font-[650] my-2">Unknown GenZ Research Group</h3>
              <p className="text-[14px] text-[var(--muted)] leading-relaxed mb-4">
                Pramana-V1 is engineered by Unknown GenZ, focused on healthcare intelligence, document provenance, and human-in-the-loop safety systems.
              </p>
              <div className="text-[13px] text-[var(--ink)] space-y-1 border-t border-[var(--line)] pt-3">
                <p className="my-0"><strong>Domain:</strong> Healthcare & Life Sciences</p>
                <p className="my-0"><strong>Primary Focus:</strong> Patient Safety & Document Provenance</p>
                <p className="my-0"><strong>Backend Schema:</strong> 31 Relational PostgreSQL Tables</p>
              </div>
            </div>

            <div className="p-6 rounded-[12px] bg-[#faf9f5] border border-[var(--line)] text-[13px] text-[var(--muted)]">
              <strong className="text-[var(--ink)] block mb-1">Authenticity & Privacy Notice:</strong>
              Do not include Protected Health Information (PHI) or identifiable patient records in web inquiries. Real patient data is strictly handled through authenticated, private institutional workspaces with tenant-isolated Row Level Security.
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
