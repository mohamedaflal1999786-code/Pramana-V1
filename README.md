# Pramana-V1 — Clinical Safety Intelligence Platform

> **"Every Alert. Backed by Evidence."**  
> Developed by **Unknown GenZ** · Domain: Healthcare Decision Support & Patient Safety  
> Technology Stack: **Next.js 14 (App Router)** · **TypeScript** · **Supabase PostgreSQL & Storage** · **Google Gemini API** · **Vercel**

---

## 1. Executive Summary & Clinical Innovation

Modern electronic health record systems frequently overwhelm clinicians with alert fatigue—generating high-frequency alerts with zero provenance, missing clinical context, and non-transparent logic.

**Pramana-V1** introduces the **Safety Provenance Graph (SPG)**: a tamper-evident, directed acyclic graph (DAG) engine that anchors every clinical safety finding directly to:
1. **Verbatim Document Spans**: Exact character offsets and page coordinates from original clinical records.
2. **Normalized Entities**: RxNorm, SNOMED CT, and LOINC codes extracted via Google Gemini AI (`gemini-3.5-flash-lite`).
3. **Deterministic Safety Rules**: Hardcoded, transparent clinical pharmacology rules (FDA Drug Labels & Lexicomp criteria) without stochastic hallucinations.
4. **Counterfactual "What-If" Simulation**: In-memory, zero-mutation simulation enabling clinicians to test dosage adjustments, allergy refutations, or newly acquired lab results before taking clinical action.
5. **Cryptographic Integrity**: SHA-256 canonical hashing for evidence spans and patient graph snapshots.

---

## 2. Key Architecture & Clinical Workspaces

Pramana-V1 provides four role-isolated workspaces and seven clinical safety intelligence modules across 36 compiled application routes:

### Role Workspaces
* **Doctor Workspace (`/workspaces/doctor`)**: Dynamic KPI telemetry, active cardiorenal patient summary, safety alert priority feed, and direct lineage inspection.
* **Pharmacist Workspace (`/workspaces/pharmacist`)**: Medication reconciliation, dosage ceiling verification, and cross-document allergy discrepancy tracking.
* **Administrator Workspace (`/workspaces/admin`)**: Institutional governance, tenant isolation, user approval workflows, and audit logging.
* **Patient Workspace (`/workspaces/patient`)**: Patient-friendly multilingual discharge guidance, medication instructions, and pending follow-ups.

### Clinical Safety Modules
* **Document Intelligence (`/workspaces/documents`)**: Multi-format ingestion (PDF, TXT, HL7 FHIR), client/server OCR, quarantine sanitization, and structured entity extraction.
* **Safety Provenance Graph (`/workspaces/graph`)**: Flagship interactive DAG visualization with layered filtering (Documents, Spans, Entities, Rules, Alerts), node inspection, and counterfactual simulation.
* **Safety Alerts & Conflicts (`/workspaces/alerts`)**: Deterministic drug-drug interaction (DDI) detection, contraindications, and dosage warnings.
* **Medication Reconciliation (`/workspaces/medications`)**: Active regimens, historical records, and allergy conflict detection.
* **Clinical Handoffs (`/workspaces/handoffs`)**: Discrepancy detection between nursing shift notes, physician orders, and transfer summaries.
* **Multilingual Discharge Guidance (`/workspaces/discharge`)**: Plain-language discharge instructions translated across 9 languages (English, Tamil, Hindi, Telugu, Malayalam, Kannada, Spanish, Arabic, Mandarin).
* **Professional Attestation & Review (`/workspaces/review`)**: Human-in-the-loop review workflow (Endorse, Reject, Request Clarification) with immutable audit logging.

---

## 3. Technology Stack & Security Safeguards

| Component | Technology | Security & Governance Specification |
| :--- | :--- | :--- |
| **Frontend & SSR** | Next.js 14 App Router, React 18, Tailwind CSS | Strict CSP, CSRF protection, secure cookie handling |
| **Database & Auth** | Supabase PostgreSQL 15, Supabase Auth SSR | Multi-tenant RLS policies, RBAC, session revocation |
| **Document Storage**| Supabase Private Storage | Private buckets (`clinical-documents`), short-lived signed URLs |
| **AI Extraction** | Google Gemini Generative AI SDK | Server-isolated execution, zero data retention for model training |
| **Graph Intelligence**| Custom Directed Acyclic Graph (DAG) Engine | Deterministic topological sorting, SHA-256 tamper-evidence |
| **Testing** | TypeScript E2E Test Suite | 15/15 automated integration tests |

> **Patient Safety & Data Privacy Notice**: Pramana-V1 strictly utilizes synthetic test fixtures (`SYNTH-PAT-001`, IRB-SYNTH-8820). No protected health information (PHI) or real patient records are ingested or stored.

---

## 4. Getting Started

### Prerequisites
* **Node.js**: v20.18.0+ LTS
* **npm**: v10+
* **Supabase Project**: With schema migrations applied (`supabase/migrations/`)
* **Google Gemini API Key**: Configured in `.env.local`

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/mxdaf/Pramana-V1.git
cd Pramana-V1

# Install dependencies
npm install
```

### 2. Environment Setup
Copy the template and configure your environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```env
NEXT_PUBLIC_APP_NAME="Pramana-V1"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-server-service-role-key"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.5-flash-lite"
```

### 3. Database Migration & Demonstration Seeding
Seed the flagship demonstration patient (`SYNTH-PAT-001` - Cardiorenal Syndrome & High-Risk DDI):
```bash
npm run seed:demo
# or
npx tsx scripts/seed-flagship-demo.ts
```

### 4. Run Automated Verification Tests
Execute the 15-test end-to-end integration suite:
```bash
npx tsx scripts/test-phase8-e2e.ts
```
Expected output: `15 passed, 0 failed (100% Pass Rate)`.

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Build
```bash
npm run build
```
Compiles all 36 application routes with static optimization and strict type validation.

---

## 5. Flagship Demonstration Walkthrough (3-Minute Tour)

1. **Patient Context**: Navigate to `/workspaces/doctor`. Observe patient `SYNTH-PAT-001` (Jane Doe, 68yo F) admitted with Acute Decompensated Heart Failure and Stage 3b Chronic Kidney Disease.
2. **Document Ingestion**: Review `/workspaces/documents` to inspect the ingested Inpatient Admission Note.
3. **Safety Provenance Graph (SPG)**: Open `/workspaces/graph`.
   * Observe the visual DAG connecting document versions, extracted evidence spans, medications (Warfarin, Lisinopril, Aspirin, Penicillin), deterministic rules, and safety alerts.
   * Click the **Warfarin + Aspirin** finding node to open the **Node Inspector**: view verbatim quotes (*"Continue home Warfarin 5mg daily..."*), character offsets `[520:710]`, and FDA DDI rule criteria.
4. **Counterfactual "What-If" Simulation**:
   * Click **"Run Counterfactual Simulation"** in the graph canvas.
   * Select hypothesis: *"Correct Lisinopril Dose"* -> Set to `20mg/day`.
   * Observe the simulated resolution of Rule `RULE-MAX-DOSE-001` with zero database mutation and instant evidence recalculation.
5. **Clinical Reconciliation & Review**: Head to `/workspaces/review` to view the audit-logged attestation controls.

---

## 6. License & Clinical Disclaimer

Pramana-V1 is an independent research platform developed for evaluation and educational demonstration. It is not an FDA-cleared software as a medical device (SaMD) and must not be used as the sole basis for clinical diagnosis or treatment. All clinical decisions remain under the sole oversight of licensed healthcare professionals.
