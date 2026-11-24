# Pramana-V1 Database Data Dictionary
**Product**: Pramana-V1 ("Every Alert. Backed by Evidence.")  
**Team**: Unknown GenZ  
**Database**: PostgreSQL 15+ (Supabase)  
**Schema Count**: 31 Relational Tables across 6 Logical Domains  

---

## 1. Domain: Institutional Management & Multi-Tenant Access

### 1.1 `public.organizations`
- **Description**: Master registry of institutional tenants (hospitals, health systems, clinical research centers).
- **Primary Key**: `id` (UUID)
- **RLS Policy**: Active members can select their own organization. Modifications restricted to platform admins.
| Column | Type | Nullable | Constraints / Defaults | Description |
|---|---|---|---|---|
| `id` | UUID | No | `DEFAULT gen_random_uuid()` | Unique institutional identifier |
| `name` | TEXT | No | | Official name of health system or hospital |
| `slug` | TEXT | No | `UNIQUE` | URL-safe institutional subdomain identifier |
| `domain` | TEXT | Yes | | Authorized institutional email domain (e.g. `hopkins.edu`) |
| `tier` | TEXT | No | `DEFAULT 'standard'`, `CHECK ('standard', 'academic', 'enterprise', 'pilot')` | Subscription and SLA tier |
| `is_active` | BOOLEAN | No | `DEFAULT true` | Tenancy activation status |
| `metadata` | JSONB | Yes | `DEFAULT '{}'::jsonb` | Institutional configuration parameters |
| `created_at` | TIMESTAMPTZ | No | `DEFAULT now()` | Inception timestamp |
| `updated_at` | TIMESTAMPTZ | No | `DEFAULT now()` | Automatic update trigger timestamp |

### 1.2 `public.profiles`
- **Description**: Extended user attributes linked to Supabase `auth.users(id)`.
- **Primary Key**: `id` (UUID)
- **RLS Policy**: Users read/update their own profile; peers within the same organization have read access.
| Column | Type | Nullable | Constraints / Defaults | Description |
|---|---|---|---|---|
| `id` | UUID | No | References `auth.users(id)` | User auth identifier |
| `full_name` | TEXT | No | | Clinician or patient full legal name |
| `email` | TEXT | No | `UNIQUE` | User professional or personal email |
| `phone` | TEXT | Yes | | Contact telephone number |
| `avatar_url` | TEXT | Yes | | URI to profile photo |
| `created_at` | TIMESTAMPTZ | No | `DEFAULT now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | `DEFAULT now()` | Automatic update trigger timestamp |

### 1.3 `public.roles`
- **Description**: Static system role definitions governing institutional access boundaries.
- **Primary Key**: `id` (TEXT)
- **RLS Policy**: Authenticated users can read the role dictionary.
| Column | Type | Nullable | Constraints / Defaults | Description |
|---|---|---|---|---|
| `id` | TEXT | No | | Role key (`platform_admin`, `institutional_admin`, `doctor`, `pharmacist`, `safety_officer`, `patient`) |
| `name` | TEXT | No | | Display name of the role |
| `description` | TEXT | No | | Detailed clinical/administrative authorization scope |
| `is_clinical` | BOOLEAN | No | `DEFAULT false` | Flag distinguishing clinical medical roles from administrative roles |
| `created_at` | TIMESTAMPTZ | No | `DEFAULT now()` | Creation timestamp |

### 1.4 `public.permissions`
- **Description**: Granular permission definitions (`org.manage`, `clinical.ingest`, `clinical.verify`, etc.).
- **Primary Key**: `id` (TEXT)
- **RLS Policy**: Authenticated users can read permission definitions.

### 1.5 `public.role_permissions`
- **Description**: Junction table mapping roles to granular capabilities.
- **Primary Key**: `(role_id, permission_id)`

### 1.6 `public.organization_members`
- **Description**: Multi-tenant association binding users to institutions with assigned roles.
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `organization_id` -> `organizations(id)`, `user_id` -> `profiles(id)`, `role_id` -> `roles(id)`
- **RLS Policy**: Members view their organization roster; admins manage members.

### 1.7 `public.invitations`
- **Description**: Institutional invitations issued by administrators.
- **Primary Key**: `id` (UUID)

### 1.8 `public.account_approval_requests`
- **Description**: Workflow queue for pending clinician user access.
- **Primary Key**: `id` (UUID)
- **Anti-Escalation Constraint**: `CONSTRAINT chk_no_self_approval CHECK (user_id != reviewed_by)`.

---

## 2. Domain: Patient & Encounter Management

### 2.1 `public.patients`
- **Description**: Institutional-scoped Master Patient Index.
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `organization_id` -> `organizations(id)`
- **Composite Unique**: `UNIQUE(organization_id, mrn)`, `UNIQUE(id, organization_id)`
- **RLS Policy**: Clinical staff within the organization and authorized patients can read.

### 2.2 `public.patient_access`
- **Description**: Explicit portal authorization grants for patients and designated caregiver proxies.
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `(patient_id, organization_id)` -> `patients(id, organization_id)`, `user_id` -> `profiles(id)`

### 2.3 `public.encounters`
- **Description**: Clinical episodes of care (inpatient admissions, outpatient visits, ICU stays).
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `(patient_id, organization_id)` -> `patients(id, organization_id)`, `attending_physician_id` -> `profiles(id)`

---

## 3. Domain: Clinical Intelligence

### 3.1 `public.clinical_documents`
- **Description**: Ingested medical documents (Discharge Summaries, Progress Notes, Handoffs, Lab Reports).
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `(patient_id, organization_id)` -> `patients(id, organization_id)`
- **File Validation**: `file_size_bytes <= 26214400` (25MB limit), `quarantine_status` (`pending_scan`, `validated`, `quarantined`, `rejected`).

### 3.2 `public.document_versions`
- **Description**: Append-only versions of clinical records with cryptographic SHA-256 hashes.
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `(document_id, organization_id)` -> `clinical_documents(id, organization_id)`

### 3.3 `public.extraction_jobs`
- **Description**: Asynchronous entity extraction jobs tracking model version and status.
- **Primary Key**: `id` (UUID)

### 3.4 `public.clinical_entities`
- **Description**: Extracted clinical findings with coordinate bounding box grounding and confidence scores.
- **Primary Key**: `id` (UUID)

### 3.5 `public.medications`
- **Description**: Active, discontinued, or reconciled medications extracted from clinical text.
- **Primary Key**: `id` (UUID)

### 3.6 `public.allergies`
- **Description**: Hypersensitivities, adverse reactions, and severity grades.
- **Primary Key**: `id` (UUID)

### 3.7 `public.lab_results`
- **Description**: Diagnostic and biochemical lab panels with reference ranges and abnormal flags.
- **Primary Key**: `id` (UUID)

---

## 4. Domain: Safety Provenance Graph

### 4.1 `public.safety_rules`
- **Description**: Versioned clinical safety rules (e.g. Duplicate Anticoagulation, Beta-Lactam Conflict).
- **Primary Key**: `id` (UUID)

### 4.2 `public.safety_rule_versions`
- **Description**: Immutable declarative logic definitions for specific rule versions.
- **Primary Key**: `id` (UUID)

### 4.3 `public.safety_alerts`
- **Description**: Real-time surveillance discrepancies flagged by rule execution.
- **Primary Key**: `id` (UUID)
- **Statuses**: `pending_review`, `endorsed`, `rejected`, `clarification_requested`, `superseded`.

### 4.4 `public.evidence_nodes`
- **Description**: Safety Provenance Graph vertices (documents, versions, entities, rules, alerts, reviews, attestations).
- **Primary Key**: `id` (UUID)

### 4.5 `public.evidence_edges`
- **Description**: Directed edges establishing bidirectional traceability in the provenance chain.
- **Primary Key**: `id` (UUID)
- **Relationships**: `contains_version`, `extracted_from`, `triggers_rule`, `generates_alert`, `reviewed_by`, `attested_by`, `superseded_by`, `contradicts`.

---

## 5. Domain: Professional Verification & Attestation

### 5.1 `public.clinical_reviews`
- **Description**: Clinician adjudication records requiring mandatory rationale for overrides.
- **Primary Key**: `id` (UUID)

### 5.2 `public.handoff_reviews`
- **Description**: Shift transition checklists between outgoing and incoming clinicians.
- **Constraint**: `CONSTRAINT chk_different_handoff_clinicians CHECK (outgoing_clinician_id != incoming_clinician_id)`.

### 5.3 `public.discharge_instructions`
- **Description**: Verified plain-language care instructions.
- **Primary Key**: `id` (UUID)

### 5.4 `public.discharge_translations`
- **Description**: Multilingual translated patient summaries (`es`, `hi`, `zh`, `ar`, `ta`).
- **Clinical Privacy**: Patients can only view translations where `is_professionally_approved = true`.

### 5.5 `public.professional_attestations`
- **Description**: Cryptographic evidence attestations binding document version, rule version, and clinician license.
- **Integrity**: Contains SHA-256 evidence chain hash.

---

## 6. Domain: Platform Governance & Audit

### 6.1 `public.audit_logs`
- **Description**: Append-only system audit trail tracking all clinical data operations.
- **Primary Key**: `id` (UUID)
- **Immutability Trigger**: `trg_audit_logs_no_modify` blocks any `UPDATE` or `DELETE`.

### 6.2 `public.contact_inquiries`
- **Description**: Institutional partnership and pilot inquiries from web portal.
- **Primary Key**: `id` (UUID)
- **Anti-Abuse**: Contains `ip_hash`, server validation, and PHI rejection guard.

### 6.3 `public.consent_records`
- **Description**: Patient consent tracking for secondary research use and proxy access.
- **Primary Key**: `id` (UUID)
