-- ==============================================================================
-- Pramana-V1 Migration 007: Private Storage Infrastructure
-- Team: Unknown GenZ
-- Buckets: clinical-documents, extracted-artifacts, discharge-exports
-- ==============================================================================

-- Create Storage Buckets using Supabase Storage API schema
-- All buckets are created as strictly private (public = false)
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

-- Storage Policies: strictly restrict storage object access to authorized organization members
-- Note: Supabase storage objects table is storage.objects
CREATE POLICY "Strict Member Clinical Document Read"
ON storage.objects FOR SELECT
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

CREATE POLICY "Strict Clinical Document Ingestion"
ON storage.objects FOR INSERT
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

CREATE POLICY "Strict Discharge Export Read"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'discharge-exports' AND
    (
        -- Clinical staff access
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.user_id = auth.uid()
              AND om.is_active = true
              AND (storage.foldername(name))[1] = om.organization_id::text
        )
        OR
        -- Patient verified access
        EXISTS (
            SELECT 1 FROM public.patient_access pa
            WHERE pa.user_id = auth.uid()
              AND pa.is_active = true
              AND (storage.foldername(name))[2] = pa.patient_id::text
        )
    )
);
