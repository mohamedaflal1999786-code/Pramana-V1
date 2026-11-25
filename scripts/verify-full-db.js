const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const tablesToCheck = [
  'organizations',
  'organization_members',
  'invitations',
  'account_approval_requests',
  'patients',
  'patient_access',
  'encounters',
  'clinical_documents',
  'document_versions',
  'extraction_jobs',
  'clinical_entities',
  'medications',
  'allergies',
  'lab_results',
  'safety_rules',
  'safety_rule_versions',
  'safety_alerts',
  'evidence_nodes',
  'evidence_edges',
  'clinical_reviews',
  'handoff_reviews',
  'discharge_instructions',
  'discharge_translations',
  'professional_attestations',
  'audit_logs',
  'contact_inquiries',
  'consent_records'
];

async function checkAll() {
  console.log('--- CHECKING ALL TABLES ---');
  let missing = [];
  let existing = [];
  for (const table of tablesToCheck) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      missing.push({ table, error: error.message });
    } else {
      existing.push({ table, count });
    }
  }

  console.log('Existing tables count:', existing.length, 'of', tablesToCheck.length);
  if (missing.length > 0) {
    console.log('Missing or error tables:', missing);
  } else {
    console.log('ALL 27 TABLES EXIST AND ARE ACCESSIBLE!');
  }

  console.log('--- CHECKING STORAGE BUCKETS ---');
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) {
    console.error('Storage bucket error:', bErr);
  } else {
    console.log('Buckets present:', buckets.map(b => `${b.id} (public: ${b.public})`));
  }

  console.log('--- CHECKING USERS ---');
  const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
  if (uErr) {
    console.error('List users error:', uErr);
  } else {
    console.log('Users in auth:', users.users.map(u => ({ id: u.id, email: u.email, confirmed: !!u.email_confirmed_at })));
  }
}

checkAll();
