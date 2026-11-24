-- ==============================================================================
-- Pramana-V1 Migration 004: Safety Provenance Graph & Rule Versioning
-- Team: Unknown GenZ
-- Tables: safety_rules, safety_rule_versions, safety_alerts,
--         evidence_nodes, evidence_edges
-- ==============================================================================

-- 1. Safety Rules (Versioned Clinical Safety Logic Registry)
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

-- Seed initial authoritative rule definitions
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

-- 2. Safety Rule Versions (Deterministic Rule Audit Trail)
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

-- 3. Safety Alerts (Surveillance Discrepancies)
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

-- 4. Evidence Nodes (Safety Provenance Graph Vertices)
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

-- 5. Evidence Edges (Safety Provenance Graph Relationships)
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
