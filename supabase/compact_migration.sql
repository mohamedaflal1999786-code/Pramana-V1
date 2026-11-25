
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT,
    tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard', 'academic', 'enterprise', 'pilot')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- References auth.users(id) in Supabase
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    is_clinical BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO roles (id, name, description, is_clinical) VALUES
    ('platform_admin', 'Platform Administrator', 'Global operational control and multi-tenant telemetry', false),
    ('institutional_admin', 'Institutional Administrator', 'Hospital tenancy, member onboarding, and facility governance', false),
    ('doctor', 'Attending Physician', 'Clinical document review, alert adjudication, and physician attestation', true),
    ('pharmacist', 'Clinical Pharmacist', 'Medication discrepancy reconciliation and pharmacovigilance oversight', true),
    ('safety_officer', 'Clinical Safety Officer', 'Systemic safety surveillance, incident escalation, and audit ledger review', true),
    ('patient', 'Patient / Authorized Representative', 'Patient guidance, verified care plan access, and plain-language summaries', false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_clinical = EXCLUDED.is_clinical;
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT NOT NULL
);
INSERT INTO permissions (id, category, description) VALUES
    ('org.manage', 'governance', 'Manage organization configuration and members'),
    ('org.view_audit', 'governance', 'Read institutional audit trail records'),
    ('clinical.ingest', 'clinical', 'Upload and trigger extraction of clinical documents'),
    ('clinical.view', 'clinical', 'Access patient clinical records and extraction graphs'),
    ('clinical.verify', 'clinical', 'Adjudicate safety alerts and create clinical attestations'),
    ('pharmacy.reconcile', 'clinical', 'Review and resolve medication discrepancies'),
    ('safety.triage', 'safety', 'Triage high-priority safety discrepancies and rules'),
    ('patient.read_own', 'patient', 'Read verified care plans and discharge guidance for self')
ON CONFLICT (id) DO NOTHING;
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('platform_admin', 'org.manage'),
    ('platform_admin', 'org.view_audit'),
    ('institutional_admin', 'org.manage'),
    ('institutional_admin', 'org.view_audit'),
    ('doctor', 'clinical.ingest'),
    ('doctor', 'clinical.view'),
    ('doctor', 'clinical.verify'),
    ('pharmacist', 'clinical.view'),
    ('pharmacist', 'pharmacy.reconcile'),
    ('safety_officer', 'clinical.view'),
    ('safety_officer', 'safety.triage'),
    ('safety_officer', 'org.view_audit'),
    ('patient', 'patient.read_own')
ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    department TEXT,
    license_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, user_id),
    CONSTRAINT chk_unique_org_user UNIQUE (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_role ON organization_members(organization_id, role_id);
CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    token TEXT UNIQUE NOT NULL,
    invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_org_email ON invitations(organization_id, email);
CREATE TABLE IF NOT EXISTS account_approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    requested_role_id TEXT NOT NULL REFERENCES roles(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    CONSTRAINT chk_no_self_approval CHECK (user_id != reviewed_by)
);
CREATE INDEX IF NOT EXISTS idx_approvals_org_status ON account_approval_requests(organization_id, status);
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    mrn TEXT NOT NULL, -- Medical Record Number, unique per organization
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'unknown')),
    is_synthetic BOOLEAN NOT NULL DEFAULT true, -- STRICT REQUIREMENT: Research synthetic flag
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, mrn),
    UNIQUE(id, organization_id) -- Enables composite foreign keys
);
CREATE INDEX IF NOT EXISTS idx_patients_org_mrn ON patients(organization_id, mrn);
CREATE INDEX IF NOT EXISTS idx_patients_org_name ON patients(organization_id, last_name, first_name);
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
CREATE TABLE IF NOT EXISTS patient_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL DEFAULT 'read' CHECK (access_level IN ('read', 'proxy_caregiver')),
    authorized_by UUID REFERENCES profiles(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE,
    UNIQUE(patient_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_patient_access_user ON patient_access(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_patient_access_patient ON patient_access(patient_id);
CREATE TABLE IF NOT EXISTS encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    encounter_number TEXT NOT NULL,
    encounter_type TEXT NOT NULL CHECK (encounter_type IN ('inpatient', 'outpatient', 'emergency', 'icu', 'telehealth')),
    attending_physician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    admission_date TIMESTAMPTZ NOT NULL,
    discharge_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'transferred', 'cancelled')),
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE,
    UNIQUE(organization_id, encounter_number),
    UNIQUE(id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_physician ON encounters(attending_physician_id);
CREATE INDEX IF NOT EXISTS idx_encounters_status ON encounters(organization_id, status);
CREATE TRIGGER update_encounters_updated_at
    BEFORE UPDATE ON encounters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
CREATE TABLE IF NOT EXISTS clinical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    encounter_id UUID,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'discharge_summary', 'progress_note', 'nursing_handoff', 
        'lab_report', 'pharmacy_order', 'transfer_record', 'consultation'
    )),
    mime_type TEXT NOT NULL CHECK (mime_type IN (
        'application/pdf', 'text/plain', 'application/json', 
        'application/xml', 'text/xml', 'application/hl7-v2+er7'
    )),
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214400), -- 25MB strict limit
    storage_path TEXT NOT NULL,
    current_version_number INT NOT NULL DEFAULT 1,
    quarantine_status TEXT NOT NULL DEFAULT 'pending_scan' CHECK (quarantine_status IN (
        'pending_scan', 'validated', 'quarantined', 'rejected'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE,
    UNIQUE(id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_documents_org_patient ON clinical_documents(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_encounter ON clinical_documents(encounter_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON clinical_documents(organization_id, document_type);
CREATE TRIGGER update_clinical_documents_updated_at
    BEFORE UPDATE ON clinical_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    document_id UUID NOT NULL,
    version_number INT NOT NULL,
    sha256_hash TEXT NOT NULL, -- Cryptographic integrity hash of file contents
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    change_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (document_id, organization_id) REFERENCES clinical_documents(id, organization_id) ON DELETE CASCADE,
    UNIQUE(document_id, version_number),
    UNIQUE(id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_doc_versions_hash ON document_versions(sha256_hash);
CREATE TABLE IF NOT EXISTS extraction_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_version_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
        'queued', 'processing', 'completed', 'failed', 'partially_extracted'
    )),
    model_version TEXT, -- Planned Gemini / NLP model identifier
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (document_version_id, organization_id) REFERENCES document_versions(id, organization_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_status ON extraction_jobs(organization_id, status);
CREATE TABLE IF NOT EXISTS clinical_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_version_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'medication', 'condition', 'allergy', 'lab_value', 'procedure', 'vital_sign', 'dosage_instruction'
    )),
    raw_text TEXT NOT NULL,
    normalized_code TEXT, -- e.g., RxNorm, SNOMED-CT, LOINC
    normalized_name TEXT,
    source_location JSONB NOT NULL DEFAULT '{}'::jsonb, -- Strict grounding: page, char_start, char_end, bounding_box
    confidence_score NUMERIC(4,3) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1.0)),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (document_version_id, organization_id) REFERENCES document_versions(id, organization_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE,
    UNIQUE(id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_entities_patient ON clinical_entities(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON clinical_entities(organization_id, entity_type);
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
    FOREIGN KEY (entity_id, organization_id) REFERENCES clinical_entities(id, organization_id) ON DELETE SET NULL,
    UNIQUE(id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(organization_id, patient_id);
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
CREATE INDEX IF NOT EXISTS idx_allergies_patient ON allergies(organization_id, patient_id);
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
CREATE INDEX IF NOT EXISTS idx_lab_results_patient ON lab_results(organization_id, patient_id);
CREATE TABLE IF NOT EXISTS safety_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code TEXT NOT NULL UNIQUE, -- e.g., 'SR-MED-001'
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'medication_conflict', 'dosage_range', 'allergy_interaction', 
        'lab_contraindication', 'handoff_omission', 'discharge_clarity'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'informational')),
    description TEXT NOT NULL,
    clinical_rationale TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_safety_rules_code ON safety_rules(rule_code);
CREATE INDEX IF NOT EXISTS idx_safety_rules_category ON safety_rules(category);
CREATE TRIGGER update_safety_rules_updated_at
    BEFORE UPDATE ON safety_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
INSERT INTO safety_rules (rule_code, name, category, severity, description, clinical_rationale) VALUES
    ('SR-MED-001', 'Duplicate Anticoagulant Therapy', 'medication_conflict', 'critical',
     'Detection of concurrent prescription or administration of multiple anticoagulant or antiplatelet agents.',
     'Co-administration of direct oral anticoagulants with low molecular weight heparin substantially elevates major haemorrhage risk.'),
    ('SR-ALG-002', 'Known Beta-Lactam Hypersensitivity Conflict', 'allergy_interaction', 'critical',
     'Patient profile documents penicillin or cephalosporin allergy while beta-lactam class medication is active.',
     'Administration of cross-reactive beta-lactams in sensitized patients risks fatal anaphylaxis.'),
    ('SR-REN-003', 'Renal Impairment Dosage Bounds Discrepancy', 'dosage_range', 'high',
     'Medication requiring renal dose reduction prescribed above safe threshold relative to estimated GFR or serum creatinine.',
     'Compromised renal clearance can lead to drug accumulation and acute nephrotoxicity.'),
    ('SR-HND-004', 'Critical Pending Lab Omission at Transfer', 'handoff_omission', 'high',
     'Handoff documentation fails to flag pending high-consequence laboratory cultures or cardiac biomarker results.',
     'Unacknowledged critical results across shift transitions result in delayed therapeutic intervention.')
ON CONFLICT (rule_code) DO NOTHING;
CREATE TABLE IF NOT EXISTS safety_rule_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES safety_rules(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    logic_definition JSONB NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(rule_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_rule_versions_rule ON safety_rule_versions(rule_id);
CREATE TABLE IF NOT EXISTS safety_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    encounter_id UUID,
    rule_version_id UUID NOT NULL REFERENCES safety_rule_versions(id) ON DELETE RESTRICT,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'informational')),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    clinical_context TEXT,
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN (
        'pending_review', 'endorsed', 'rejected', 'clarification_requested', 'superseded'
    )),
    confidence_score NUMERIC(4,3) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1.0)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE,
    UNIQUE(id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_alerts_org_status ON safety_alerts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_patient ON safety_alerts(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON safety_alerts(organization_id, severity);
CREATE TRIGGER update_safety_alerts_updated_at
    BEFORE UPDATE ON safety_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
CREATE TABLE IF NOT EXISTS evidence_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    node_type TEXT NOT NULL CHECK (node_type IN (
        'clinical_document', 'document_version', 'source_chunk', 'extracted_entity', 
        'versioned_rule', 'safety_alert', 'clinical_review', 'professional_attestation'
    )),
    reference_id UUID NOT NULL, -- Logical pointer to the originating table record
    label TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- Strict coordinate grounding { page, char_start, char_end, quote }
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE,
    UNIQUE(id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_nodes_patient ON evidence_nodes(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_nodes_type_ref ON evidence_nodes(node_type, reference_id);
CREATE TABLE IF NOT EXISTS evidence_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    source_node_id UUID NOT NULL,
    target_node_id UUID NOT NULL,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'contains_version', 'extracted_from', 'triggers_rule', 'generates_alert', 
        'reviewed_by', 'attested_by', 'superseded_by', 'contradicts'
    )),
    weight NUMERIC(4,3) DEFAULT 1.0,
    provenance_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (source_node_id, organization_id) REFERENCES evidence_nodes(id, organization_id) ON DELETE CASCADE,
    FOREIGN KEY (target_node_id, organization_id) REFERENCES evidence_nodes(id, organization_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE,
    UNIQUE(source_node_id, target_node_id, relationship_type)
);
CREATE INDEX IF NOT EXISTS idx_edges_patient ON evidence_edges(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_edges_source ON evidence_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON evidence_edges(target_node_id);
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
    CONSTRAINT chk_different_handoff_clinicians CHECK (outgoing_clinician_id != incoming_clinician_id)
);
CREATE INDEX IF NOT EXISTS idx_handoffs_encounter ON handoff_reviews(encounter_id);
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
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    client_ip TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time ON audit_logs(organization_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE OR REPLACE FUNCTION enforce_audit_logs_append_only()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION '[Pramana-V1 Security] UPDATE or DELETE operations on audit_logs are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_audit_logs_no_modify
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION enforce_audit_logs_append_only();
CREATE TABLE IF NOT EXISTS contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    inquiry_type TEXT NOT NULL DEFAULT 'pilot_inquiry' CHECK (inquiry_type IN (
        'pilot_inquiry', 'research_collaboration', 'security_audit', 'general'
    )),
    message TEXT NOT NULL,
    is_reviewed BOOLEAN NOT NULL DEFAULT false,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_hash TEXT, -- One-way hash for anti-abuse and rate limiting
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created ON contact_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON contact_inquiries(email);
CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'treatment_summary_access', 'research_secondary_use', 'caregiver_proxy_access'
    )),
    status TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'revoked', 'expired')),
    granted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    valid_until TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_consent_patient ON consent_records(organization_id, patient_id);
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'clinical-documents', 
        'clinical-documents', 
        false, 
        26214400, -- 25 MB in bytes
        ARRAY[
            'application/pdf', 
            'text/plain', 
            'application/json', 
            'application/xml', 
            'text/xml', 
            'application/hl7-v2+er7'
        ]::text[]
    ),
    (
        'extracted-artifacts', 
        'extracted-artifacts', 
        false, 
        26214400, 
        ARRAY[
            'application/json', 
            'text/plain', 
            'image/png'
        ]::text[]
    ),
    (
        'discharge-exports', 
        'discharge-exports', 
        false, 
        26214400, 
        ARRAY[
            'application/pdf', 
            'application/json', 
            'text/plain'
        ]::text[]
    )
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 26214400,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS "Strict Member Clinical Document Read" ON storage.objects;
CREATE POLICY "Strict Member Clinical Document Read" ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'clinical-documents' AND
    EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.roles r ON om.role_id = r.id
        WHERE om.user_id = auth.uid()
          AND om.is_active = true
          AND r.is_clinical = true
          AND (storage.foldername(name))[1] = om.organization_id::text
    )
);
DROP POLICY IF EXISTS "Strict Clinical Document Ingestion" ON storage.objects;
CREATE POLICY "Strict Clinical Document Ingestion" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'clinical-documents' AND
    EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.roles r ON om.role_id = r.id
        WHERE om.user_id = auth.uid()
          AND om.is_active = true
          AND om.role_id IN ('doctor', 'pharmacist', 'safety_officer')
          AND (storage.foldername(name))[1] = om.organization_id::text
    )
);
DROP POLICY IF EXISTS "Strict Discharge Export Read" ON storage.objects;
CREATE POLICY "Strict Discharge Export Read" ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'discharge-exports' AND
    (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.user_id = auth.uid()
              AND om.is_active = true
              AND (storage.foldername(name))[1] = om.organization_id::text
        )
        OR
        EXISTS (
            SELECT 1 FROM public.patient_access pa
            WHERE pa.user_id = auth.uid()
              AND pa.is_active = true
              AND (storage.foldername(name))[2] = pa.patient_id::text
        )
    )
);
CREATE OR REPLACE FUNCTION get_user_active_org_ids()
RETURNS TABLE (org_id UUID) 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE sql STABLE AS $$
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
      AND is_active = true;
$$;
CREATE OR REPLACE FUNCTION user_has_org_role(target_org_id UUID, required_role TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE sql STABLE AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.organization_members 
        WHERE user_id = auth.uid() 
          AND organization_id = target_org_id 
          AND role_id = required_role 
          AND is_active = true
    );
$$;
CREATE OR REPLACE FUNCTION user_has_clinical_role(target_org_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE sql STABLE AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.organization_members om
        JOIN public.roles r ON om.role_id = r.id
        WHERE om.user_id = auth.uid() 
          AND om.organization_id = target_org_id 
          AND r.is_clinical = true 
          AND om.is_active = true
    );
$$;
CREATE OR REPLACE FUNCTION user_has_patient_access(target_patient_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE sql STABLE AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.patient_access 
        WHERE user_id = auth.uid() 
          AND patient_id = target_patient_id 
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > now())
    );
$$;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_member_read_org" ON organizations;
CREATE POLICY "org_member_read_org" ON organizations FOR SELECT
TO authenticated
USING (id IN (SELECT get_user_active_org_ids()));
DROP POLICY IF EXISTS "user_read_own_profile" ON profiles;
CREATE POLICY "user_read_own_profile" ON profiles FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.organization_members my_m
        JOIN public.organization_members peer_m ON my_m.organization_id = peer_m.organization_id
        WHERE my_m.user_id = auth.uid() AND peer_m.user_id = profiles.id AND my_m.is_active = true
    )
);
DROP POLICY IF EXISTS "user_update_own_profile" ON profiles;
CREATE POLICY "user_update_own_profile" ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "authenticated_read_roles" ON roles;
CREATE POLICY "authenticated_read_roles" ON roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_read_permissions" ON permissions;
CREATE POLICY "authenticated_read_permissions" ON permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_read_role_permissions" ON role_permissions;
CREATE POLICY "authenticated_read_role_permissions" ON role_permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "members_read_organization_roster" ON organization_members;
CREATE POLICY "members_read_organization_roster" ON organization_members FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()));
DROP POLICY IF EXISTS "admins_manage_members" ON organization_members;
CREATE POLICY "admins_manage_members" ON organization_members FOR ALL
TO authenticated
USING (user_has_org_role(organization_id, 'institutional_admin') OR user_has_org_role(organization_id, 'platform_admin'))
WITH CHECK (user_has_org_role(organization_id, 'institutional_admin') OR user_has_org_role(organization_id, 'platform_admin'));
DROP POLICY IF EXISTS "admins_manage_invitations" ON invitations;
CREATE POLICY "admins_manage_invitations" ON invitations FOR ALL
TO authenticated
USING (user_has_org_role(organization_id, 'institutional_admin'))
WITH CHECK (user_has_org_role(organization_id, 'institutional_admin'));
DROP POLICY IF EXISTS "users_read_own_approval_requests" ON account_approval_requests;
CREATE POLICY "users_read_own_approval_requests" ON account_approval_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR user_has_org_role(organization_id, 'institutional_admin'));
DROP POLICY IF EXISTS "users_insert_approval_requests" ON account_approval_requests;
CREATE POLICY "users_insert_approval_requests" ON account_approval_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND status = 'pending');
DROP POLICY IF EXISTS "admins_update_approval_requests" ON account_approval_requests;
CREATE POLICY "admins_update_approval_requests" ON account_approval_requests FOR UPDATE
TO authenticated
USING (user_has_org_role(organization_id, 'institutional_admin') AND user_id != auth.uid())
WITH CHECK (user_has_org_role(organization_id, 'institutional_admin') AND user_id != auth.uid());
DROP POLICY IF EXISTS "clinical_staff_read_patients" ON patients;
CREATE POLICY "clinical_staff_read_patients" ON patients FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR user_has_patient_access(id)
);
DROP POLICY IF EXISTS "clinical_staff_manage_patients" ON patients;
CREATE POLICY "clinical_staff_manage_patients" ON patients FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "patients_view_own_access_grants" ON patient_access;
CREATE POLICY "patients_view_own_access_grants" ON patient_access FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR organization_id IN (SELECT get_user_active_org_ids()));
DROP POLICY IF EXISTS "clinical_staff_read_encounters" ON encounters;
CREATE POLICY "clinical_staff_read_encounters" ON encounters FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR user_has_patient_access(patient_id)
);
DROP POLICY IF EXISTS "clinical_staff_read_documents" ON clinical_documents;
CREATE POLICY "clinical_staff_read_documents" ON clinical_documents FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "clinical_staff_insert_documents" ON clinical_documents;
CREATE POLICY "clinical_staff_insert_documents" ON clinical_documents FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "clinical_staff_read_versions" ON document_versions;
CREATE POLICY "clinical_staff_read_versions" ON document_versions FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "clinical_staff_insert_versions" ON document_versions;
CREATE POLICY "clinical_staff_insert_versions" ON document_versions FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "clinical_staff_read_extractions" ON extraction_jobs;
CREATE POLICY "clinical_staff_read_extractions" ON extraction_jobs FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "clinical_staff_read_entities" ON clinical_entities;
CREATE POLICY "clinical_staff_read_entities" ON clinical_entities FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "clinical_staff_read_medications" ON medications;
CREATE POLICY "clinical_staff_read_medications" ON medications FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR user_has_patient_access(patient_id)
);
DROP POLICY IF EXISTS "clinical_staff_read_allergies" ON allergies;
CREATE POLICY "clinical_staff_read_allergies" ON allergies FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR user_has_patient_access(patient_id)
);
DROP POLICY IF EXISTS "clinical_staff_read_labs" ON lab_results;
CREATE POLICY "clinical_staff_read_labs" ON lab_results FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR user_has_patient_access(patient_id)
);
DROP POLICY IF EXISTS "authenticated_read_safety_rules" ON safety_rules;
CREATE POLICY "authenticated_read_safety_rules" ON safety_rules FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_read_safety_rule_versions" ON safety_rule_versions;
CREATE POLICY "authenticated_read_safety_rule_versions" ON safety_rule_versions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "clinical_staff_read_alerts" ON safety_alerts;
CREATE POLICY "clinical_staff_read_alerts" ON safety_alerts FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "clinical_staff_update_alerts" ON safety_alerts;
CREATE POLICY "clinical_staff_update_alerts" ON safety_alerts FOR UPDATE
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
WITH CHECK (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "clinical_staff_read_nodes" ON evidence_nodes;
CREATE POLICY "clinical_staff_read_nodes" ON evidence_nodes FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "clinical_staff_read_edges" ON evidence_edges;
CREATE POLICY "clinical_staff_read_edges" ON evidence_edges FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "clinical_staff_read_reviews" ON clinical_reviews;
CREATE POLICY "clinical_staff_read_reviews" ON clinical_reviews FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "doctors_pharmacists_insert_reviews" ON clinical_reviews;
CREATE POLICY "doctors_pharmacists_insert_reviews" ON clinical_reviews FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (SELECT get_user_active_org_ids()) AND 
    reviewer_id = auth.uid() AND
    user_has_clinical_role(organization_id)
);
DROP POLICY IF EXISTS "clinical_staff_read_handoffs" ON handoff_reviews;
CREATE POLICY "clinical_staff_read_handoffs" ON handoff_reviews FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "clinicians_manage_handoffs" ON handoff_reviews;
CREATE POLICY "clinicians_manage_handoffs" ON handoff_reviews FOR ALL
TO authenticated
USING (
    organization_id IN (SELECT get_user_active_org_ids()) AND 
    (outgoing_clinician_id = auth.uid() OR incoming_clinician_id = auth.uid())
)
WITH CHECK (
    organization_id IN (SELECT get_user_active_org_ids()) AND 
    (outgoing_clinician_id = auth.uid() OR incoming_clinician_id = auth.uid())
);
DROP POLICY IF EXISTS "staff_and_patients_read_discharge" ON discharge_instructions;
CREATE POLICY "staff_and_patients_read_discharge" ON discharge_instructions FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR (user_has_patient_access(patient_id) AND is_verified = true)
);
DROP POLICY IF EXISTS "clinicians_manage_discharge" ON discharge_instructions;
CREATE POLICY "clinicians_manage_discharge" ON discharge_instructions FOR ALL
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
WITH CHECK (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "read_discharge_translations" ON discharge_translations;
CREATE POLICY "read_discharge_translations" ON discharge_translations FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR (
        is_professionally_approved = true AND 
        EXISTS (
            SELECT 1 FROM public.discharge_instructions di 
            WHERE di.id = discharge_translations.instruction_id 
              AND user_has_patient_access(di.patient_id)
        )
    )
);
DROP POLICY IF EXISTS "clinical_read_attestations" ON professional_attestations;
CREATE POLICY "clinical_read_attestations" ON professional_attestations FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));
DROP POLICY IF EXISTS "clinicians_insert_attestations" ON professional_attestations;
CREATE POLICY "clinicians_insert_attestations" ON professional_attestations FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (SELECT get_user_active_org_ids()) AND 
    attestor_id = auth.uid() AND
    user_has_org_role(organization_id, 'doctor')
);
DROP POLICY IF EXISTS "admins_safety_officers_read_audit" ON audit_logs;
CREATE POLICY "admins_safety_officers_read_audit" ON audit_logs FOR SELECT
TO authenticated
USING (
    organization_id IN (SELECT get_user_active_org_ids()) AND 
    (user_has_org_role(organization_id, 'institutional_admin') OR 
     user_has_org_role(organization_id, 'platform_admin') OR 
     user_has_org_role(organization_id, 'safety_officer'))
);
DROP POLICY IF EXISTS "audit_logs_system_insert" ON audit_logs;
CREATE POLICY "audit_logs_system_insert" ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_active_org_ids()) OR organization_id IS NULL);
DROP POLICY IF EXISTS "public_insert_contact_inquiries" ON contact_inquiries;
CREATE POLICY "public_insert_contact_inquiries" ON contact_inquiries FOR INSERT
TO anon, authenticated
WITH CHECK (
    length(name) >= 2 AND 
    length(email) >= 5 AND 
    length(message) >= 10
);
DROP POLICY IF EXISTS "platform_admins_read_contact_inquiries" ON contact_inquiries;
CREATE POLICY "platform_admins_read_contact_inquiries" ON contact_inquiries FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.user_id = auth.uid() 
          AND om.role_id = 'platform_admin' 
          AND om.is_active = true
    )
);
DROP POLICY IF EXISTS "read_consent_records" ON consent_records;
CREATE POLICY "read_consent_records" ON consent_records FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR user_has_patient_access(patient_id)
);
