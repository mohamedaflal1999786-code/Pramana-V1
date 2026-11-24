-- ==============================================================================
-- Pramana-V1 Migration 006: Platform Governance, Audit Ledger & Contact Inquiries
-- Team: Unknown GenZ
-- Tables: audit_logs, contact_inquiries, consent_records
-- ==============================================================================

-- 1. Audit Logs (Application-Level Append-Only System Trail)
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

-- Enforce Strict Append-Only Behavior via Trigger
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

-- 2. Contact Inquiries (Institutional Partnership Inquiries)
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

-- 3. Consent Records (Patient Authorization & Research Secondary-Use Registry)
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
