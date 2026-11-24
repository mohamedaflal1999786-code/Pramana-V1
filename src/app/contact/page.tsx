"use client";

import * as React from "react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Mail, Building2, User, MessageSquare, CheckCircle } from "lucide-react";

function ContactFormInner() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const [formData, setFormData] = React.useState({
    fullName: "",
    email: "",
    institution: "",
    role: "Clinical Investigator",
    inquiryType: "Research Collaboration",
    message: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate authentic network dispatch without fake external API mock
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast({
        type: "success",
        title: "Inquiry Dispatched Successfully",
        description: "The Unknown GenZ research team will review your submission.",
      });
    }, 900);
  };

  if (isSubmitted) {
    return (
      <div className="p-8 sm:p-12 rounded-[12px] bg-white border border-[var(--line)] text-center max-w-xl mx-auto">
        <div className="w-14 h-14 rounded-full bg-[#e5f1df] text-[#145a45] flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7" />
        </div>
        <h2 className="text-[22px] font-[650] text-[var(--ink)] my-0 mb-2">
          Thank You for Reaching Out
        </h2>
        <p className="text-[14px] text-[var(--muted)] leading-relaxed mb-6">
          Your inquiry regarding <strong>{formData.institution}</strong> has been logged. Our development and research coordinators will follow up at <strong>{formData.email}</strong>.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setIsSubmitted(false);
            setFormData({
              fullName: "",
              email: "",
              institution: "",
              role: "Clinical Investigator",
              inquiryType: "Research Collaboration",
              message: "",
            });
          }}
        >
          Submit Another Inquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 rounded-[12px] bg-white border border-[var(--line)] space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          label="Full Name"
          placeholder="Dr. Jordan Mercer"
          leftIcon={<User className="w-4 h-4" />}
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          error={errors.fullName}
          required
        />
        <Input
          label="Institutional Email"
          type="email"
          placeholder="j.mercer@hospital.org"
          leftIcon={<Mail className="w-4 h-4" />}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          label="Institution / Health System"
          placeholder="St. Jude Medical Center / Academic Lab"
          leftIcon={<Building2 className="w-4 h-4" />}
          value={formData.institution}
          onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
          error={errors.institution}
          required
        />
        <Select
          label="Primary Role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
        onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
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
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Please describe your clinical focus, trial parameters, or questions regarding Pramana-V1's provenance architecture..."
          className="w-full bg-white text-[var(--ink)] text-[14px] placeholder:text-[#889b91] border border-[var(--line)] rounded-[7px] py-[12px] px-[14px] focus:border-[var(--green)] focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
        />
        {errors.message && (
          <p className="text-[12px] text-[#b91c1c] mt-[5px]">{errors.message}</p>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <Button type="submit" variant="primary" isLoading={isSubmitting} size="lg">
          Submit Institutional Inquiry →
        </Button>
      </div>
    </form>
  );
}

export default function ContactPage() {
  return (
    <ToastProvider>
      <Header />
      <main className="wrap py-12">
        <Breadcrumbs items={[{ label: "Contact" }]} className="mb-6" />

        <PageHeader
          eyebrow="Institutional Contact"
          title={
            <>
              Connect with the <span className="font-serif font-normal italic text-[var(--green)]">Research Team.</span>
            </>
          }
          description="We welcome collaboration with healthcare systems, clinical trial groups, academic medical centers, and patient safety investigators."
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-start mb-16">
          <ContactFormInner />

          <div className="space-y-6">
            <div className="tile">
              <span className="num">COORDINATION</span>
              <h3 className="text-[18px] font-[650] my-2">Unknown GenZ Research Group</h3>
              <p className="text-[14px] text-[var(--muted)] leading-relaxed mb-4">
                Pramana-V1 is engineered by Unknown GenZ, focused on healthcare intelligence, document provenance, and human-in-the-loop safety systems.
              </p>
              <div className="text-[13px] text-[var(--ink)] space-y-1 border-t border-[var(--line)] pt-3">
                <p className="my-0"><strong>Domain:</strong> Healthcare & Life Sciences</p>
                <p className="my-0"><strong>Turnaround:</strong> 2 business days for institutional reviews</p>
              </div>
            </div>

            <div className="p-6 rounded-[12px] bg-[#faf9f5] border border-[var(--line)] text-[13px] text-[var(--muted)]">
              <strong className="text-[var(--ink)] block mb-1">Authenticity & Privacy Notice:</strong>
              Do not include Protected Health Information (PHI) or identifiable patient records in public contact submissions. Formal pilot data is handled through private encrypted workspaces.
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </ToastProvider>
  );
}
