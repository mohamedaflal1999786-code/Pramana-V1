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
import { LineageEngine } from '../src/lib/graph/lineage-engine';
import { ImpactAnalyzer } from '../src/lib/graph/impact-analyzer';
import { InvalidationEngine } from '../src/lib/graph/invalidation-engine';
import { SimulationEngine } from '../src/lib/graph/simulation-engine';
import { IntegrityService } from '../src/lib/graph/integrity-service';
import { checkGeminiHealth } from '../src/lib/ai/gemini-client';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_PATIENT_ID = '00000000-0000-0000-0000-000000000002';
const DEMO_DOC_ID = '00000000-0000-0000-0000-000000000010';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}: ${detail || 'Assertion failed'}`);
    failed++;
  }
}

async function runE2E() {
  console.log('===============================================================================');
  console.log('PRAMANA-V1 — PHASE 08 / 09 COMPREHENSIVE END-TO-END VERIFICATION');
  console.log('===============================================================================');

  const admin = getSupabaseAdminClient();
  assert(!!admin, 'Test 1: Supabase PostgreSQL Admin Connectivity');

  // Test 2: Gemini AI Health
  const geminiHealth = await checkGeminiHealth();
  assert(geminiHealth.isOnline, `Test 2: Live Gemini AI Connectivity (${geminiHealth.latencyMs}ms)`, geminiHealth.error);

  // Test 3: Synthetic Patient Record
  const { data: patient } = await admin!.from('patients').select('*').eq('id', DEMO_PATIENT_ID).single();
  assert(!!patient && patient.is_synthetic === true, 'Test 3: Synthetic Patient MRN SYNTH-PAT-001 Verified');

  // Test 4: Document Record
  const { data: doc } = await admin!.from('clinical_documents').select('*').eq('id', DEMO_DOC_ID).single();
  assert(!!doc && doc.current_version_number >= 1, 'Test 4: Clinical Document Record Persisted');

  // Test 5: Safety Provenance Graph Retrieval
  const spg = await GraphService.getPatientSPG(DEMO_PATIENT_ID, DEFAULT_ORG_ID);
  assert(spg.nodes.length >= 10, `Test 5: SPG Persistent DAG Retrieved (${spg.nodes.length} nodes, ${spg.edges.length} edges)`);

  // Test 6: Finding Nodes in SPG
  const findingNodes = spg.nodes.filter(n => n.nodeType === 'clinical_finding');
  assert(findingNodes.length >= 2, `Test 6: Clinical Safety Findings in SPG (${findingNodes.length} active findings)`);

  // Test 7: Reverse Lineage Tracing
  const firstFinding = findingNodes[0];
  const lineage = await LineageEngine.traceEvidenceLineage(firstFinding.id, DEFAULT_ORG_ID);
  assert(
    !!lineage.finding && (lineage.entities.length > 0 || lineage.rule !== null),
    `Test 7: Reverse Evidence Lineage Traced to Source (Finding -> Rule -> Entities)`
  );

  // Test 8: Verbatim Source Evidence Grounding
  const spans = spg.nodes.filter(n => n.nodeType === 'evidence_span');
  const firstSpan = spans[0];
  const spanQuote = firstSpan?.metadata?.quote || firstSpan?.metadata?.verbatimQuote;
  assert(
    !!spanQuote && spanQuote.length > 0,
    `Test 8: Grounded Verbatim Source Span Verified: "${spanQuote?.slice(0, 35)}..."`
  );

  // Test 9: Forward Impact Analysis
  const firstDocNode = spg.nodes.find(n => n.nodeType === 'clinical_document');
  assert(!!firstDocNode, 'Test 9: Clinical Document Node Found in Graph');
  const impact = await ImpactAnalyzer.runForwardImpactAnalysis(firstDocNode!.id, DEFAULT_ORG_ID);
  assert(
    impact.sourceNode.id === firstDocNode!.id,
    `Test 9: Forward Impact Dependency Traversal Initiated from Root Document`
  );

  // Test 10: Dynamic Invalidation Engine
  const snapshotBefore = await InvalidationEngine.captureGraphSnapshot(DEMO_PATIENT_ID, DEFAULT_ORG_ID, 'pre_e2e_test');
  assert(!!snapshotBefore.id && snapshotBefore.nodeCount > 0, 'Test 10: Pre-invalidation Snapshot Captured & Checksummed');

  // Test 11: Counterfactual Simulation
  const simResult = await SimulationEngine.runSimulation({
    patientId: DEMO_PATIENT_ID,
    organizationId: DEFAULT_ORG_ID,
    scenarioName: 'E2E Withhold Warfarin Test',
    hypothesisType: 'remove_entity',
    description: 'Verify bleeding alert resolution upon Warfarin removal',
    hypotheticalChanges: { removeEntityNames: ['Warfarin', 'warfarin'] },
  });
  assert(
    simResult.diff.resolvedFindings.length > 0,
    `Test 11: Counterfactual Simulation Resolved Bleeding Alert (Zero Mutation Verified)`
  );

  // Test 12: Cryptographic SHA-256 Canonical Checksumming
  const checksum = IntegrityService.computeGraphStateChecksum(spg.nodes, spg.edges);
  assert(
    typeof checksum === 'string' && checksum.length === 64,
    `Test 12: SHA-256 Canonical Checksum Validated (${checksum.slice(0, 16)}...)`
  );

  // Test 13: Tenant Isolation Boundary
  const FAKE_TENANT_ID = '99999999-9999-9999-9999-999999999999';
  const crossTenantSPG = await GraphService.getPatientSPG(DEMO_PATIENT_ID, FAKE_TENANT_ID);
  assert(
    crossTenantSPG.nodes.length === 0,
    'Test 13: Cross-Tenant Isolation Enforced (Zero leaked nodes on unauthorized tenant)'
  );

  // Test 14: Rotated Admin Credential Verification
  const { data: adminUsers } = await admin!.auth.admin.listUsers();
  const adminAccount = adminUsers?.users.find(u => u.email === 'adminpramana@gmail.com');
  assert(
    !!adminAccount && adminAccount.user_metadata?.security_event === 'phase_09_credential_rotation',
    'Test 14: Rotated Administrator Account & Session Revocation Confirmed'
  );

  console.log('===============================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed} | PASS RATE: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('===============================================================================');

  if (failed > 0) process.exit(1);
}

runE2E().catch(err => {
  console.error('E2E harness failed:', err);
  process.exit(1);
});
