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

async function setPassword() {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    console.error('No admin client available.');
    process.exit(1);
  }

  const { data: users, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr || !users) {
    console.error('Failed to list users:', listErr);
    process.exit(1);
  }

  const targetUser = users.users.find(u => u.email === 'adminpramana@gmail.com');
  if (!targetUser) {
    console.error('adminpramana@gmail.com not found');
    process.exit(1);
  }

  const desiredPassword = 'Taanu@29082008';

  const { data: updateData, error: updateErr } = await admin.auth.admin.updateUserById(targetUser.id, {
    password: desiredPassword,
    email_confirm: true,
    user_metadata: {
      ...targetUser.user_metadata,
      role: 'platform_admin',
      is_active: true,
      approval_status: 'approved',
    },
  });

  if (updateErr) {
    console.error('Failed to set password:', updateErr.message);
  } else {
    console.log('Password successfully set to desired password for adminpramana@gmail.com!');
  }
}

setPassword().catch(console.error);
