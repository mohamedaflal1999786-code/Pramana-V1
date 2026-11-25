-- 1. Extraction Jobs & Clinical Entities
CREATE TABLE IF NOT EXISTS extraction_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'partially_extracted')),
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(id, organization_id)
);

CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    entity_id UUID,
    drug_name TEXT NOT NULL,
    dose TEXT,
    frequency TEXT,
    route TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'hold', 'historical')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE,
    UNIQUE(id, organization_id)
);

CREATE TABLE IF NOT EXISTS allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    allergen TEXT NOT NULL,
    reaction TEXT,
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE,
    UNIQUE(id, organization_id)
);

CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    test_name TEXT NOT NULL,
    value TEXT NOT NULL,
    unit TEXT,
    reference_range TEXT,
    flag TEXT CHECK (flag IN ('normal', 'abnormal', 'critical_high', 'critical_low')),
    result_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE,
    UNIQUE(id, organization_id)
);

-- 2. Safety Rule Versions & Graph Vertices/Edges
CREATE TABLE IF NOT EXISTS safety_rule_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES safety_rules(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    logic_definition JSONB NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(rule_id, version_number)
);

CREATE TABLE IF NOT EXISTS evidence_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    node_type TEXT NOT NULL,
    reference_id UUID NOT NULL,
    label TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE,
    UNIQUE(id, organization_id)
);

CREATE TABLE IF NOT EXISTS evidence_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    source_node_id UUID NOT NULL,
    target_node_id UUID NOT NULL,
    relationship_type TEXT NOT NULL,
    weight NUMERIC(4,3) DEFAULT 1.0,
    provenance_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (source_node_id, organization_id) REFERENCES evidence_nodes(id, organization_id) ON DELETE CASCADE,
    FOREIGN KEY (target_node_id, organization_id) REFERENCES evidence_nodes(id, organization_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE,
    UNIQUE(source_node_id, target_node_id, relationship_type)
);

-- 3. Professional Reviews, Handoffs, Discharge & Attestation
CREATE TABLE IF NOT EXISTS clinical_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alert_id UUID NOT NULL,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    reviewer_role TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    review_decision TEXT NOT NULL,
    clinical_rationale TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (alert_id, organization_id) REFERENCES safety_alerts(id, organization_id) ON DELETE CASCADE,
    UNIQUE(id, organization_id)
);

CREATE TABLE IF NOT EXISTS handoff_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    encounter_id UUID NOT NULL,
    outgoing_clinician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    incoming_clinician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    critical_actions_reviewed BOOLEAN NOT NULL DEFAULT false,
    pending_lab_orders_reviewed BOOLEAN NOT NULL DEFAULT false,
    code_status_verified BOOLEAN NOT NULL DEFAULT false,
    handoff_status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (encounter_id, organization_id) REFERENCES encounters(id, organization_id) ON DELETE CASCADE,
    CONSTRAINT chk_different_handoff_clinicians CHECK (outgoing_clinician_id != incoming_clinician_id)
);

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

CREATE TABLE IF NOT EXISTS professional_attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    attestor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    attestor_role TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    license_number TEXT,
    document_version_id UUID NOT NULL,
    evidence_chain_hash TEXT NOT NULL,
    attestation_statement TEXT NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (document_version_id, organization_id) REFERENCES document_versions(id, organization_id) ON DELETE RESTRICT,
    UNIQUE(id, organization_id)
);

CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    consent_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'granted',
    granted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE
);

-- 4. Enable RLS on Part 2 Tables
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- 5. Storage Buckets (Private 25MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES 
    ('clinical-documents', 'clinical-documents', false, 26214400),
    ('extracted-artifacts', 'extracted-artifacts', false, 26214400),
    ('discharge-exports', 'discharge-exports', false, 26214400)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 26214400;
