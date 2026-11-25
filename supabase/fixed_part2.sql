-- ==============================================================================
-- Pramana-V1 Migration Part 2 (FIXED with safety_rules)
-- ==============================================================================

-- 1. Safety Rules (Required by safety_rule_versions)
CREATE TABLE IF NOT EXISTS safety_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'medication_conflict',
    severity TEXT NOT NULL DEFAULT 'high',
    description TEXT NOT NULL,
    clinical_rationale TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO safety_rules (rule_code, name, category, severity, description, clinical_rationale) VALUES
    ('SR-MED-001', 'Duplicate Anticoagulant Therapy', 'medication_conflict', 'critical', 'Concurrent anticoagulant prescriptions.', 'Risk of major haemorrhage.'),
    ('SR-ALG-002', 'Beta-Lactam Hypersensitivity Conflict', 'allergy_interaction', 'critical', 'Penicillin/cephalosporin allergy conflict.', 'Risk of anaphylaxis.'),
    ('SR-REN-003', 'Renal Impairment Dosage Discrepancy', 'dosage_range', 'high', 'Dose exceeds safe threshold for renal clearance.', 'Risk of nephrotoxicity.'),
    ('SR-HND-004', 'Critical Pending Lab Omission', 'handoff_omission', 'high', 'Handoff fails to flag critical pending cultures.', 'Delayed therapeutic intervention.')
ON CONFLICT (rule_code) DO NOTHING;

-- 2. Safety Rule Versions
CREATE TABLE IF NOT EXISTS safety_rule_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES safety_rules(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    logic_definition JSONB NOT NULL DEFAULT '{}'::jsonb,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(rule_id, version_number)
);

-- 3. Extraction Jobs & Clinical Entities
CREATE TABLE IF NOT EXISTS extraction_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued',
    model_version TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    normalized_code TEXT,
    normalized_name TEXT,
    source_location JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence_score NUMERIC(4,3),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    entity_id UUID,
    drug_name TEXT NOT NULL,
    dose TEXT,
    frequency TEXT,
    route TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergen TEXT NOT NULL,
    reaction TEXT,
    severity TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    value TEXT NOT NULL,
    unit TEXT,
    reference_range TEXT,
    flag TEXT,
    result_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Evidence Nodes & Edges (Safety Provenance Graph)
CREATE TABLE IF NOT EXISTS evidence_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    node_type TEXT NOT NULL,
    reference_id UUID NOT NULL,
    label TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidence_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES evidence_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES evidence_nodes(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    weight NUMERIC(4,3) DEFAULT 1.0,
    provenance_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(source_node_id, target_node_id, relationship_type)
);

-- 5. Reviews, Handoffs, Discharge & Attestation
CREATE TABLE IF NOT EXISTS clinical_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alert_id UUID NOT NULL REFERENCES safety_alerts(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    reviewer_role TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    review_decision TEXT NOT NULL,
    clinical_rationale TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS handoff_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    outgoing_clinician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    incoming_clinician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    critical_actions_reviewed BOOLEAN NOT NULL DEFAULT false,
    pending_lab_orders_reviewed BOOLEAN NOT NULL DEFAULT false,
    code_status_verified BOOLEAN NOT NULL DEFAULT false,
    handoff_status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_different_handoff_clinicians CHECK (outgoing_clinician_id != incoming_clinician_id)
);

CREATE TABLE IF NOT EXISTS discharge_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id UUID,
    primary_language TEXT NOT NULL DEFAULT 'en',
    dietary_guidelines TEXT,
    activity_restrictions TEXT,
    follow_up_appointments JSONB DEFAULT '[]'::jsonb,
    warning_symptoms JSONB DEFAULT '[]'::jsonb,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discharge_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    instruction_id UUID NOT NULL REFERENCES discharge_instructions(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    translated_content JSONB NOT NULL,
    translation_engine TEXT NOT NULL DEFAULT 'human_verified_draft',
    is_professionally_approved BOOLEAN NOT NULL DEFAULT false,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(instruction_id, language_code)
);

CREATE TABLE IF NOT EXISTS professional_attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    attestor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    attestor_role TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    license_number TEXT,
    document_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE RESTRICT,
    evidence_chain_hash TEXT NOT NULL,
    attestation_statement TEXT NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'granted',
    granted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE safety_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- 7. Storage Buckets (Private 25MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES 
    ('clinical-documents', 'clinical-documents', false, 26214400),
    ('extracted-artifacts', 'extracted-artifacts', false, 26214400),
    ('discharge-exports', 'discharge-exports', false, 26214400)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 26214400;
