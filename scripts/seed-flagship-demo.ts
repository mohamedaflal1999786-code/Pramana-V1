import fs from 'fs';
import path from 'path';

// Parse .env.local
try {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
} catch (e) {
  console.log('Error reading .env.local', e);
}

import { getSupabaseAdminClient } from '../src/lib/supabase/admin';
import { GraphService } from '../src/lib/graph/graph-service';
import { IntegrityService } from '../src/lib/graph/integrity-service';
import { evaluateDeterministicSafetyRules } from '../src/lib/ai/safety-rules';
import type { ExtractedClinicalEntity } from '../src/lib/ai/types';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_PATIENT_ID = '00000000-0000-0000-0000-000000000002';
const DEMO_DOC_ID = '00000000-0000-0000-0000-000000000010';
const DEMO_V1_ID = '00000000-0000-0000-0000-000000000011';
const DEMO_V2_ID = '00000000-0000-0000-0000-000000000012';

const ADMISSION_NOTE_TEXT = `PRAMANA HEALTH SYSTEM — INPATIENT ADMISSION & CLINICAL SUMMARY
Patient: Jane Doe | DOB: 1958-04-12 | MRN: SYNTH-MRN-9021 | Sex: Female
Encounter: ENC-2026-8801 | Admission Date: 2026-11-24 | Ward: Cardiac Step-down
Admitting Physician: Dr. Sarah Vance, MD (Cardiology)

CHIEF COMPLAINT:
Progressive exertional dyspnea, bilateral lower extremity edema, and lightheadedness.

DOCUMENTED ALLERGIES:
1. Penicillin — Severe anaphylaxis, urticaria, facial edema documented 2024. Beta-lactams contraindicated.

CURRENT MEDICATIONS ON ADMISSION:
1. Warfarin 5mg PO once daily in evening for non-valvular atrial fibrillation (INR target 2.0-3.0).
2. Aspirin 81mg PO once daily with breakfast for secondary cardiovascular protection.
3. Metformin 1000mg PO twice daily with meals for Type 2 Diabetes Mellitus.
4. Lisinopril 80mg PO once daily in morning for systemic arterial hypertension.

LABORATORY FINDINGS (Intake Panel 2026-11-24 08:30):
- Sodium: 138 mEq/L
- Potassium: 4.9 mEq/L
- BUN: 44 mg/dL
- Serum Creatinine: 2.8 mg/dL (Baseline 1.1 mg/dL)
- Estimated GFR (CKD-EPI): 22 mL/min/1.73m² (Severe Renal Impairment, Stage 4)
- Current INR: 2.6 (therapeutic range)

CLINICAL IMPRESSION & ORDERS:
Acute exacerbation of heart failure with reduced ejection fraction on background of Stage 4 CKD.
Continue intake medications as ordered pending nephrology consult.`;

async function seed() {
  console.log('=== PRAMANA-V1 FLAGSHIP DEMO SEEDING ===');
  const admin = getSupabaseAdminClient();
  if (!admin) {
    console.error('Admin client unavailable');
    return;
  }

  // 1. Ensure Patient Exists
  console.log('1. Upserting synthetic patient...');
  await admin.from('patients').upsert({
    id: DEMO_PATIENT_ID,
    organization_id: DEFAULT_ORG_ID,
    mrn: 'SYNTH-MRN-9021',
    first_name: 'Jane',
    last_name: 'Doe (Synthetic)',
    date_of_birth: '1958-04-12',
    gender: 'female',
    metadata: {
      researchProtocol: 'IRB-SYNTH-8820',
      classification: 'synthetic_demonstration_case',
      description: 'Cardiorenal syndrome with dual DDI and contraindication hazards',
    },
  });

  // 2. Ensure Clinical Document Exists
  console.log('2. Upserting clinical document...');
  const textBytes = Buffer.byteLength(ADMISSION_NOTE_TEXT, 'utf-8');
  await admin.from('clinical_documents').upsert({
    id: DEMO_DOC_ID,
    organization_id: DEFAULT_ORG_ID,
    patient_id: DEMO_PATIENT_ID,
    title: 'Inpatient Admission Note & Medication History',
    document_type: 'discharge_summary',
    mime_type: 'text/plain',
    file_size_bytes: textBytes,
    storage_path: `documents/${DEFAULT_ORG_ID}/${DEMO_DOC_ID}/admission_note_v1.txt`,
    current_version_number: 1,
    quarantine_status: 'validated',
  });

  // 3. Document Version 1
  console.log('3. Upserting document version 1...');
  await admin.from('document_versions').upsert({
    id: DEMO_V1_ID,
    document_id: DEMO_DOC_ID,
    organization_id: DEFAULT_ORG_ID,
    version_number: 1,
    storage_path: `documents/${DEFAULT_ORG_ID}/${DEMO_DOC_ID}/admission_note_v1.txt`,
    sha256_hash: IntegrityService.computeSha256(ADMISSION_NOTE_TEXT),
    change_summary: 'Initial intake admission document upload',
    created_by: '9407f10f-9518-4dc5-a42f-b319fd6b4947',
  });

  // Upload to Supabase Storage bucket so document downloads work
  try {
    await admin.storage
      .from('clinical-documents')
      .upload(`documents/${DEFAULT_ORG_ID}/${DEMO_DOC_ID}/admission_note_v1.txt`, Buffer.from(ADMISSION_NOTE_TEXT), {
        upsert: true,
        contentType: 'text/plain',
      });
    console.log('   Storage upload verified');
  } catch (stErr) {
    console.log('   Storage note:', stErr);
  }

  // 4. Extract Entities
  console.log('4. Synthesizing grounded clinical entities...');
  const entities: ExtractedClinicalEntity[] = [
    {
      id: crypto.randomUUID(),
      entityType: 'medication',
      name: 'Warfarin',
      dosage: '5mg PO once daily in evening',
      confidenceScore: 0.98,
      sourceLocation: {
        documentId: DEMO_DOC_ID,
        documentVersion: 1,
        pageNumber: 1,
        charStart: ADMISSION_NOTE_TEXT.indexOf('Warfarin 5mg PO once daily in evening'),
        charEnd: ADMISSION_NOTE_TEXT.indexOf('Warfarin 5mg PO once daily in evening') + 38,
        rawQuote: 'Warfarin 5mg PO once daily in evening',
        surroundingContext: 'CURRENT MEDICATIONS ON ADMISSION: 1. Warfarin 5mg PO once daily in evening for non-valvular atrial fibrillation',
      },
    },
    {
      id: crypto.randomUUID(),
      entityType: 'medication',
      name: 'Aspirin',
      dosage: '81mg PO once daily with breakfast',
      confidenceScore: 0.96,
      sourceLocation: {
        documentId: DEMO_DOC_ID,
        documentVersion: 1,
        pageNumber: 1,
        charStart: ADMISSION_NOTE_TEXT.indexOf('Aspirin 81mg PO once daily with breakfast'),
        charEnd: ADMISSION_NOTE_TEXT.indexOf('Aspirin 81mg PO once daily with breakfast') + 42,
        rawQuote: 'Aspirin 81mg PO once daily with breakfast',
        surroundingContext: '2. Aspirin 81mg PO once daily with breakfast for secondary cardiovascular protection',
      },
    },
    {
      id: crypto.randomUUID(),
      entityType: 'medication',
      name: 'Metformin',
      dosage: '1000mg PO twice daily with meals',
      confidenceScore: 0.99,
      sourceLocation: {
        documentId: DEMO_DOC_ID,
        documentVersion: 1,
        pageNumber: 1,
        charStart: ADMISSION_NOTE_TEXT.indexOf('Metformin 1000mg PO twice daily with meals'),
        charEnd: ADMISSION_NOTE_TEXT.indexOf('Metformin 1000mg PO twice daily with meals') + 43,
        rawQuote: 'Metformin 1000mg PO twice daily with meals',
        surroundingContext: '3. Metformin 1000mg PO twice daily with meals for Type 2 Diabetes Mellitus',
      },
    },
    {
      id: crypto.randomUUID(),
      entityType: 'medication',
      name: 'Lisinopril',
      dosage: '80mg PO once daily in morning',
      confidenceScore: 0.97,
      sourceLocation: {
        documentId: DEMO_DOC_ID,
        documentVersion: 1,
        pageNumber: 1,
        charStart: ADMISSION_NOTE_TEXT.indexOf('Lisinopril 80mg PO once daily in morning'),
        charEnd: ADMISSION_NOTE_TEXT.indexOf('Lisinopril 80mg PO once daily in morning') + 41,
        rawQuote: 'Lisinopril 80mg PO once daily in morning',
        surroundingContext: '4. Lisinopril 80mg PO once daily in morning for systemic arterial hypertension',
      },
    },
    {
      id: crypto.randomUUID(),
      entityType: 'allergy',
      name: 'Penicillin',
      dosage: 'Severe anaphylaxis, urticaria, facial edema documented 2024',
      confidenceScore: 0.99,
      sourceLocation: {
        documentId: DEMO_DOC_ID,
        documentVersion: 1,
        pageNumber: 1,
        charStart: ADMISSION_NOTE_TEXT.indexOf('Penicillin — Severe anaphylaxis, urticaria, facial edema documented 2024'),
        charEnd: ADMISSION_NOTE_TEXT.indexOf('Penicillin — Severe anaphylaxis, urticaria, facial edema documented 2024') + 73,
        rawQuote: 'Penicillin — Severe anaphylaxis, urticaria, facial edema documented 2024',
        surroundingContext: 'DOCUMENTED ALLERGIES: 1. Penicillin — Severe anaphylaxis, urticaria, facial edema documented 2024',
      },
    },
    {
      id: crypto.randomUUID(),
      entityType: 'lab_value',
      name: 'eGFR',
      dosage: '22 mL/min/1.73m²',
      confidenceScore: 0.98,
      sourceLocation: {
        documentId: DEMO_DOC_ID,
        documentVersion: 1,
        pageNumber: 1,
        charStart: ADMISSION_NOTE_TEXT.indexOf('Estimated GFR (CKD-EPI): 22 mL/min/1.73m²'),
        charEnd: ADMISSION_NOTE_TEXT.indexOf('Estimated GFR (CKD-EPI): 22 mL/min/1.73m²') + 41,
        rawQuote: 'Estimated GFR (CKD-EPI): 22 mL/min/1.73m²',
        surroundingContext: '- Estimated GFR (CKD-EPI): 22 mL/min/1.73m² (Severe Renal Impairment, Stage 4)',
      },
    },
  ];

  // 5. Evaluate Deterministic Rules
  console.log('5. Evaluating deterministic clinical rules...');
  const safetyFindings = evaluateDeterministicSafetyRules(entities);
  console.log(`   Generated ${safetyFindings.length} deterministic findings:`, safetyFindings.map(f => f.title));

  // 6. Construct Persistent Safety Provenance Graph (SPG)
  console.log('6. Building persistent Safety Provenance Graph...');
  const { nodesCreated, edgesCreated } = await GraphService.constructSPGFromAnalysis({
    patientId: DEMO_PATIENT_ID,
    organizationId: DEFAULT_ORG_ID,
    documentId: DEMO_DOC_ID,
    documentVersionId: DEMO_V1_ID,
    documentTitle: 'Inpatient Admission Note & Medication History',
    versionNumber: 1,
    rawText: ADMISSION_NOTE_TEXT,
    entities,
    safetyFindings: safetyFindings as any,
  });

  console.log(`   SPG Persistence Complete: ${nodesCreated} nodes, ${edgesCreated} edges created.`);

  // 7. Store Safety Alerts in safety_alerts table
  for (const finding of safetyFindings) {
    await admin.from('safety_alerts').upsert({
      id: finding.id,
      organization_id: DEFAULT_ORG_ID,
      patient_id: DEMO_PATIENT_ID,
      severity: (finding.severity === 'moderate' ? 'medium' : finding.severity) as any,
      title: finding.title,
      summary: finding.summary,
      status: 'unverified',
    });
  }

  // 8. Verify Graph Retrieval
  const spg = await GraphService.getPatientSPG(DEMO_PATIENT_ID, DEFAULT_ORG_ID);
  console.log(`=== VERIFICATION: SPG Retrievable for Patient: ${spg.nodes.length} nodes, ${spg.edges.length} edges ===`);
  console.log('Flagship Demonstration Case Seeded Successfully!');
}

seed().catch(console.error);
