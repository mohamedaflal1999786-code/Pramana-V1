-- ==============================================================================
-- Pramana-V1 Migration 005: Professional Verification & Attestation
-- Team: Unknown GenZ
-- Tables: clinical_reviews, handoff_reviews, discharge_instructions,
--         discharge_translations, professional_attestations
-- ==============================================================================

-- 1. Clinical Reviews (Adjudication of Discrepancies)
CREATE TABLE IF NOT EXISTS clinical_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alert_id UUID NOT NULL,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    reviewer_role TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    review_decision TEXT NOT NULL CHECK (review_decision IN (
        'endorsed', 'rejected', 'clarification_requested', 'superseded'
    )),
    clinical_rationale TEXT NOT NULL, -- Mandatory justification for overrides or rejections
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (alert_id, organization_id) REFERENCES safety_alerts(id, organization_id) ON DELETE CASCADE,
    UNIQUE(id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_alert ON clinical_reviews(alert_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON clinical_reviews(reviewer_id);

-- 2. Handoff Reviews (Shift Transition Verification)
CREATE TABLE IF NOT EXISTS handoff_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    encounter_id UUID NOT NULL,
    outgoing_clinician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    incoming_clinician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    critical_actions_reviewed BOOLEAN NOT NULL DEFAULT false,
    pending_lab_orders_reviewed BOOLEAN NOT NULL DEFAULT false,
    code_status_verified BOOLEAN NOT NULL DEFAULT false,
    handoff_status TEXT NOT NULL DEFAULT 'pending' CHECK (handoff_status IN (
        'pending', 'completed', 'discrepancy_flagged'
    )),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (encounter_id, organization_id) REFERENCES encounters(id, organization_id) ON DELETE CASCADE,
    -- Prevent outgoing clinician from signing as incoming clinician
    CONSTRAINT chk_different_handoff_clinicians CHECK (outgoing_clinician_id != incoming_clinician_id)
);

CREATE INDEX IF NOT EXISTS idx_handoffs_encounter ON handoff_reviews(encounter_id);

-- 3. Discharge Instructions (Care Plan Summaries)
CREATE TABLE IF NOT EXISTS discharge_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    encounter_id UUID,
    primary_language TEXT NOT NULL DEFAULT 'en',
    dietary_guidelines TEXT,
    activity_restrictions TEXT,
    follow_up_appointments JSONB DEFAULT '[]'::jsonb,
    warning_symptoms JSONB DEFAULT '[]'::jsonb,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE,
    UNIQUE(id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_discharge_patient ON discharge_instructions(organization_id, patient_id);

CREATE TRIGGER update_discharge_instructions_updated_at
    BEFORE UPDATE ON discharge_instructions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Discharge Translations (Multilingual Verification including Tamil)
CREATE TABLE IF NOT EXISTS discharge_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    instruction_id UUID NOT NULL,
    language_code TEXT NOT NULL CHECK (language_code IN ('es', 'hi', 'zh', 'ar', 'ta')),
    translated_content JSONB NOT NULL,
    translation_engine TEXT NOT NULL DEFAULT 'human_verified_draft',
    is_professionally_approved BOOLEAN NOT NULL DEFAULT false,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (instruction_id, organization_id) REFERENCES discharge_instructions(id, organization_id) ON DELETE CASCADE,
    UNIQUE(instruction_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_translations_instruction ON discharge_translations(instruction_id, language_code);

-- 5. Professional Attestations (Cryptographic Record-Level Evidence Attestation)
CREATE TABLE IF NOT EXISTS professional_attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    attestor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    attestor_role TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    license_number TEXT,
    document_version_id UUID NOT NULL,
    evidence_chain_hash TEXT NOT NULL, -- SHA-256 integrity hash of verified evidence graph nodes
    attestation_statement TEXT NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (document_version_id, organization_id) REFERENCES document_versions(id, organization_id) ON DELETE RESTRICT,
    UNIQUE(id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_attestations_doc_version ON professional_attestations(document_version_id);
CREATE INDEX IF NOT EXISTS idx_attestations_attestor ON professional_attestations(attestor_id);
