-- ==============================================================================
-- Pramana-V1 Migration 002: Patient & Encounter Management
-- Team: Unknown GenZ
-- Tables: patients, patient_access, encounters
-- ==============================================================================

-- 1. Patients (Institutional-Scoped Master Patient Index)
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

-- 2. Patient Access Grants (Explicit Patient Portal & Caregiver Authorization)
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

-- 3. Encounters (Clinical Episodes of Care)
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
