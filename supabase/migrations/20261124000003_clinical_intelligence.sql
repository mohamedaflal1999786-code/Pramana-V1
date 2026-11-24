-- ==============================================================================
-- Pramana-V1 Migration 003: Clinical Intelligence & Extraction Foundation
-- Team: Unknown GenZ
-- Tables: clinical_documents, document_versions, extraction_jobs,
--         clinical_entities, medications, allergies, lab_results
-- ==============================================================================

-- 1. Clinical Documents (Document Ingestion Catalog)
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

-- 2. Document Versions (Append-Only Version History with SHA-256 Hashes)
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

-- 3. Extraction Jobs (Asynchronous Extraction Lifecycle)
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

-- 4. Clinical Entities (Extracted Entities with Coordinate Grounding)
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

-- 5. Medications (Reconciled & Extracted Drug Therapy)
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

-- 6. Allergies (Adverse Reactions & Drug Hypersensitivity)
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

-- 7. Lab Results (Biochemical & Diagnostic Values)
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
