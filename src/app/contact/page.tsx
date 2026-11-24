"use client";

import * as React from "react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Mail, Building2, User, Info, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = React.useState({
    fullName: "",
    email: "",
    institution: "",
    role: "Clinical Investigator",
    inquiryType: "Research Collaboration",
    message: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [validationPassed, setValidationPassed] = React.useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = "Please enter your full name.";
    if (!formData.email.trim() || !formData.email.includes("@")) {
      errs.email = "Please enter a valid institutional email address.";
    }
    if (!formData.institution.trim()) errs.institution = "Please specify your institution or health system.";
    if (!formData.message.trim() || formData.message.length < 20) {
      errs.message = "Please provide details regarding your inquiry (minimum 20 characters).";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleValidateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setValidationPassed(true);
    } else {
      setValidationPassed(false);
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
                <strong className="text-[var(--ink)] block mb-0.5">Frontend Interface Notice</strong>
                During Phase 02 frontend development, automated web dispatch endpoints are inactive to prevent unverified transmission. The form below provides client-side validation. Formal institutional inquiries should be directed to the research team at <span className="font-mono text-[var(--ink)] font-semibold">research@pramana-v1.local</span>.
              </div>
            </div>

            <form onSubmit={handleValidateForm} className="p-8 rounded-[12px] bg-white border border-[var(--line)] space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Full Name"
                  placeholder="Dr. Jordan Mercer"
                  leftIcon={<User className="w-4 h-4" />}
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    setValidationPassed(false);
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
                    setValidationPassed(false);
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
                    setValidationPassed(false);
                  }}
                  error={errors.institution}
                  required
                />
                <Select
                  label="Primary Role"
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value });
                    setValidationPassed(false);
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
                  setValidationPassed(false);
                }}
                options={[
                  { value: "Research Collaboration", label: "Research Collaboration & Pilot Study" },
                  { value: "Platform Architecture Assessment", label: "Platform Architecture Assessment" },
                  { value: "Security & Compliance Evaluation", label: "Security & Compliance Evaluation" },
                  { value: "General Academic Inquiry", label: "General Academic Inquiry" },
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
                    setValidationPassed(false);
                  }}
                  placeholder="Please describe your clinical focus, trial parameters, or questions regarding Pramana-V1's provenance architecture..."
                  className="w-full bg-white text-[var(--ink)] text-[14px] placeholder:text-[#889b91] border border-[var(--line)] rounded-[7px] py-[12px] px-[14px] focus:border-[var(--green)] focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
                />
                {errors.message && (
                  <p className="text-[12px] text-[#b91c1c] mt-[5px]">{errors.message}</p>
                )}
              </div>

              {validationPassed && (
                <div className="p-4 rounded-[7px] bg-[#eef6ec] border border-[#b9d6c4] flex items-start gap-3 text-[13px] text-[#145a45]">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <strong>Validation Successful:</strong> All required fields satisfy institutional formatting standards. Active email dispatch will be connected in Phase 03 with Supabase & edge functions.
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="lg">
                  Validate Inquiry Structure →
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
              </div>
            </div>

            <div className="p-6 rounded-[12px] bg-[#faf9f5] border border-[var(--line)] text-[13px] text-[var(--muted)]">
              <strong className="text-[var(--ink)] block mb-1">Authenticity & Privacy Notice:</strong>
              Do not include Protected Health Information (PHI) or identifiable patient records in web inquiries. Real patient data is strictly handled through authenticated, private institutional workspaces.
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
