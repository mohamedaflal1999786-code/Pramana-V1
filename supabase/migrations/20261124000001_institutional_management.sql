-- ==============================================================================
-- Pramana-V1 Migration 001: Institutional Management & Multi-Tenant Access
-- Team: Unknown GenZ
-- Tables: organizations, profiles, roles, permissions, role_permissions,
--         organization_members, invitations, account_approval_requests
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to handle updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Organizations (Healthcare Tenancy Root)
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

-- 2. User Profiles (Linked to auth.users in Supabase Auth)
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

-- 3. System Roles & RBAC Registry
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

-- 4. Granular Permissions
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

-- 5. Role-Permission Junction
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

-- 6. Organization Memberships (Tenancy Binding)
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

-- 7. Invitations
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

-- 8. Account Approval Requests (Prevents Self-Approval / Privilege Escalation)
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
    -- Strictly prohibit self-approval at database constraint level
    CONSTRAINT chk_no_self_approval CHECK (user_id != reviewed_by)
);

CREATE INDEX IF NOT EXISTS idx_approvals_org_status ON account_approval_requests(organization_id, status);
