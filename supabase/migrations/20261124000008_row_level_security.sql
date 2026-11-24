-- ==============================================================================
-- Pramana-V1 Migration 008: Row Level Security (RLS) & Access Control
-- Team: Unknown GenZ
-- Enforces: Multi-tenant isolation, role-based least privilege, patient privacy,
--           preventing privilege escalation and default-deny for anonymous actors.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Helper Security Functions (SECURITY DEFINER with explicit search_path)
-- ------------------------------------------------------------------------------

-- Get list of organizations where the current user has an active membership
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

-- Check if current user has a specific role in an organization
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

-- Check if current user has a clinical role (doctor, pharmacist, safety_officer)
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

-- Check if current user is an authorized patient or proxy for a patient record
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

-- ------------------------------------------------------------------------------
-- 2. Enable RLS on All Tables
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 3. Institutional Management Policies
-- ------------------------------------------------------------------------------

-- Organizations: members can read their own organization details
CREATE POLICY "org_member_read_org" ON organizations FOR SELECT
TO authenticated
USING (id IN (SELECT get_user_active_org_ids()));

-- Profiles: users can read and update their own profile; colleagues in same org can read
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

CREATE POLICY "user_update_own_profile" ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Roles & Permissions: readable by authenticated users
CREATE POLICY "authenticated_read_roles" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_permissions" ON permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_role_permissions" ON role_permissions FOR SELECT TO authenticated USING (true);

-- Organization Members: members can view colleagues; admins can manage
CREATE POLICY "members_read_organization_roster" ON organization_members FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()));

CREATE POLICY "admins_manage_members" ON organization_members FOR ALL
TO authenticated
USING (user_has_org_role(organization_id, 'institutional_admin') OR user_has_org_role(organization_id, 'platform_admin'))
WITH CHECK (user_has_org_role(organization_id, 'institutional_admin') OR user_has_org_role(organization_id, 'platform_admin'));

-- Invitations: institutional admins can manage
CREATE POLICY "admins_manage_invitations" ON invitations FOR ALL
TO authenticated
USING (user_has_org_role(organization_id, 'institutional_admin'))
WITH CHECK (user_has_org_role(organization_id, 'institutional_admin'));

-- Account Approvals: applicants can view their own; admins review (no self-approval)
CREATE POLICY "users_read_own_approval_requests" ON account_approval_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR user_has_org_role(organization_id, 'institutional_admin'));

CREATE POLICY "users_insert_approval_requests" ON account_approval_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "admins_update_approval_requests" ON account_approval_requests FOR UPDATE
TO authenticated
USING (user_has_org_role(organization_id, 'institutional_admin') AND user_id != auth.uid())
WITH CHECK (user_has_org_role(organization_id, 'institutional_admin') AND user_id != auth.uid());

-- ------------------------------------------------------------------------------
-- 4. Clinical & Patient Policies (Strict Separation from Pure Admins)
-- ------------------------------------------------------------------------------

-- Patients: Accessible to clinical staff in the org OR the authorized patient
CREATE POLICY "clinical_staff_read_patients" ON patients FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR user_has_patient_access(id)
);

CREATE POLICY "clinical_staff_manage_patients" ON patients FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

-- Patient Access: users can see their own grants; clinical staff / admins can manage
CREATE POLICY "patients_view_own_access_grants" ON patient_access FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR organization_id IN (SELECT get_user_active_org_ids()));

-- Encounters: Accessible to clinical staff in the org OR authorized patient
CREATE POLICY "clinical_staff_read_encounters" ON encounters FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR user_has_patient_access(patient_id)
);

-- Clinical Documents & Versions: Strictly clinical staff
CREATE POLICY "clinical_staff_read_documents" ON clinical_documents FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

CREATE POLICY "clinical_staff_insert_documents" ON clinical_documents FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

CREATE POLICY "clinical_staff_read_versions" ON document_versions FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

CREATE POLICY "clinical_staff_insert_versions" ON document_versions FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

-- Extraction Jobs, Entities, Medications, Allergies, Labs
CREATE POLICY "clinical_staff_read_extractions" ON extraction_jobs FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

CREATE POLICY "clinical_staff_read_entities" ON clinical_entities FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

CREATE POLICY "clinical_staff_read_medications" ON medications FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR user_has_patient_access(patient_id)
);

CREATE POLICY "clinical_staff_read_allergies" ON allergies FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR user_has_patient_access(patient_id)
);

CREATE POLICY "clinical_staff_read_labs" ON lab_results FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR user_has_patient_access(patient_id)
);

-- ------------------------------------------------------------------------------
-- 5. Safety Intelligence & Provenance Graph Policies
-- ------------------------------------------------------------------------------

-- Safety Rules & Versions: readable by all authenticated clinical & administrative staff
CREATE POLICY "authenticated_read_safety_rules" ON safety_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_safety_rule_versions" ON safety_rule_versions FOR SELECT TO authenticated USING (true);

-- Safety Alerts: clinical staff only
CREATE POLICY "clinical_staff_read_alerts" ON safety_alerts FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

CREATE POLICY "clinical_staff_update_alerts" ON safety_alerts FOR UPDATE
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
WITH CHECK (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

-- Evidence Nodes & Edges: clinical staff only
CREATE POLICY "clinical_staff_read_nodes" ON evidence_nodes FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

CREATE POLICY "clinical_staff_read_edges" ON evidence_edges FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

-- ------------------------------------------------------------------------------
-- 6. Professional Verification & Attestation Policies
-- ------------------------------------------------------------------------------

-- Clinical Reviews
CREATE POLICY "clinical_staff_read_reviews" ON clinical_reviews FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

CREATE POLICY "doctors_pharmacists_insert_reviews" ON clinical_reviews FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (SELECT get_user_active_org_ids()) AND 
    reviewer_id = auth.uid() AND
    user_has_clinical_role(organization_id)
);

-- Handoff Reviews
CREATE POLICY "clinical_staff_read_handoffs" ON handoff_reviews FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

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

-- Discharge Instructions: clinical staff can manage; patients can read verified instructions
CREATE POLICY "staff_and_patients_read_discharge" ON discharge_instructions FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR (user_has_patient_access(patient_id) AND is_verified = true)
);

CREATE POLICY "clinicians_manage_discharge" ON discharge_instructions FOR ALL
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
WITH CHECK (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

-- Discharge Translations: patient can only see professionally approved translations
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

-- Professional Attestations: read by clinical staff; created by authorized attestor
CREATE POLICY "clinical_read_attestations" ON professional_attestations FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id));

CREATE POLICY "clinicians_insert_attestations" ON professional_attestations FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (SELECT get_user_active_org_ids()) AND 
    attestor_id = auth.uid() AND
    user_has_org_role(organization_id, 'doctor')
);

-- ------------------------------------------------------------------------------
-- 7. Platform Governance & Contact Policies
-- ------------------------------------------------------------------------------

-- Audit Logs: strictly read-only for administrators and safety officers of the org
CREATE POLICY "admins_safety_officers_read_audit" ON audit_logs FOR SELECT
TO authenticated
USING (
    organization_id IN (SELECT get_user_active_org_ids()) AND 
    (user_has_org_role(organization_id, 'institutional_admin') OR 
     user_has_org_role(organization_id, 'platform_admin') OR 
     user_has_org_role(organization_id, 'safety_officer'))
);

CREATE POLICY "audit_logs_system_insert" ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_active_org_ids()) OR organization_id IS NULL);

-- Contact Inquiries:
-- Anyone (including public/anonymous) can insert a legitimate partnership inquiry
CREATE POLICY "public_insert_contact_inquiries" ON contact_inquiries FOR INSERT
TO anon, authenticated
WITH CHECK (
    length(name) >= 2 AND 
    length(email) >= 5 AND 
    length(message) >= 10
);

-- Only platform administrators can read contact inquiries
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

-- Consent Records: accessible by patient and clinical staff
CREATE POLICY "read_consent_records" ON consent_records FOR SELECT
TO authenticated
USING (
    (organization_id IN (SELECT get_user_active_org_ids()) AND user_has_clinical_role(organization_id))
    OR user_has_patient_access(patient_id)
);
