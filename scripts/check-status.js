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

async function run() {
  console.log('Connecting to:', env.NEXT_PUBLIC_SUPABASE_URL);
  
  // Check tables
  const { data: sr, error: srErr } = await supabase.from('safety_rules').select('*').limit(3);
  console.log('safety_rules query: error=', srErr?.message || null, 'sample count=', sr?.length);
  
  // Check storage buckets
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  console.log('storage buckets: error=', bErr?.message || null, 'buckets=', buckets?.map(b => b.name));

  // Check organizations
  const { data: orgs, error: orgErr } = await supabase.from('organizations').select('id, name').limit(3);
  console.log('organizations: error=', orgErr?.message || null, 'count=', orgs?.length);
}

run();
