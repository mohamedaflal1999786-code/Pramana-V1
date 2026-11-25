-- ==============================================================================
-- Pramana-V1 Migration: Phase 07 Safety Provenance Graph (SPG) Infrastructure
-- Team: Unknown GenZ
-- Tables: graph_snapshots, invalidation_events, reassessment_jobs,
--         evidence_integrity_hashes
-- Indexes & RLS Policies for Provenance Traversal & Dynamic Invalidation
-- ==============================================================================

-- 1. Graph Snapshots (Versioned SPG States for Historical Replay & Audit)
CREATE TABLE IF NOT EXISTS graph_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    trigger_event TEXT NOT NULL CHECK (trigger_event IN (
        'initial_analysis', 'document_superseded', 'document_corrected',
        'document_withdrawn', 'rule_updated', 'manual_attestation', 'simulation_checkpoint'
    )),
    trigger_reference_id UUID, -- Document, rule, or finding ID that prompted the snapshot
    snapshot_data JSONB NOT NULL, -- Serialized graph vertices, edges, and finding states
    node_count INT NOT NULL DEFAULT 0,
    edge_count INT NOT NULL DEFAULT 0,
    sha256_hash TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_graph_snapshots_patient ON graph_snapshots(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_graph_snapshots_version ON graph_snapshots(patient_id, version_number);

-- 2. Invalidation Events (Audit Log of Dynamic Evidence Invalidation)
CREATE TABLE IF NOT EXISTS invalidation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN (
        'document_version', 'clinical_document', 'reference_rule', 'laboratory_correction'
    )),
    source_id UUID NOT NULL,
    superseded_by_id UUID,
    reason TEXT NOT NULL,
    affected_finding_ids UUID[] NOT NULL DEFAULT '{}',
    affected_review_ids UUID[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed')),
    sha256_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invalidation_events_patient ON invalidation_events(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_invalidation_events_source ON invalidation_events(source_type, source_id);

-- 3. Reassessment Jobs (Queue for Human Review Following Evidence Invalidation)
CREATE TABLE IF NOT EXISTS reassessment_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    invalidation_event_id UUID REFERENCES invalidation_events(id) ON DELETE SET NULL,
    finding_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_review', 'reassessed_endorsed', 'reassessed_rejected', 'superseded'
    )),
    assigned_reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reassessment_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reassessment_jobs_org_status ON reassessment_jobs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_reassessment_jobs_patient ON reassessment_jobs(patient_id);

-- 4. Evidence Integrity Hashes (Cryptographic Verification Chain)
CREATE TABLE IF NOT EXISTS evidence_integrity_hashes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'clinical_document', 'document_version', 'evidence_span', 'graph_snapshot', 'audit_event'
    )),
    entity_id UUID NOT NULL,
    canonical_content TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    previous_hash TEXT, -- Linked cryptographic chain
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_valid BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_evidence_integrity_entity ON evidence_integrity_hashes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_evidence_integrity_hash ON evidence_integrity_hashes(sha256_hash);

-- 5. Enable Row Level Security (RLS) on all Phase 07 Tables
ALTER TABLE graph_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE invalidation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reassessment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_integrity_hashes ENABLE ROW LEVEL SECURITY;

-- 6. Institutional Tenant Isolation Policies
DROP POLICY IF EXISTS "graph_snapshots_tenant_isolation" ON graph_snapshots;
CREATE POLICY "graph_snapshots_tenant_isolation" ON graph_snapshots
    FOR ALL
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "invalidation_events_tenant_isolation" ON invalidation_events;
CREATE POLICY "invalidation_events_tenant_isolation" ON invalidation_events
    FOR ALL
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "reassessment_jobs_tenant_isolation" ON reassessment_jobs;
CREATE POLICY "reassessment_jobs_tenant_isolation" ON reassessment_jobs
    FOR ALL
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "evidence_integrity_tenant_isolation" ON evidence_integrity_hashes;
CREATE POLICY "evidence_integrity_tenant_isolation" ON evidence_integrity_hashes
    FOR ALL
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
