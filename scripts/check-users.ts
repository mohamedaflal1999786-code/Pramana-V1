import fs from 'fs';
import path from 'path';

// Parse .env.local manually
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

async function main() {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    console.error('No admin client available. SUPABASE_SERVICE_ROLE_KEY present?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    return;
  }
  const { data: usersData, error: uErr } = await admin.auth.admin.listUsers();
  if (uErr) {
    console.error('Error listing users:', uErr);
  } else {
    console.log('=== AUTH.USERS ===');
    console.log(usersData?.users?.map(u => ({
      id: u.id,
      email: u.email,
      confirmed_at: u.email_confirmed_at,
      user_metadata: u.user_metadata,
      app_metadata: u.app_metadata
    })));
  }

  const { data: members, error: mErr } = await admin.from('organization_members').select('*');
  console.log('=== ORGANIZATION_MEMBERS ===');
  console.log(members);

  const { data: profiles, error: pErr } = await admin.from('profiles').select('*');
  console.log('=== PROFILES ===');
  console.log(profiles);
}

main().catch(console.error);
