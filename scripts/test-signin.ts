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

import { createClient } from '@supabase/supabase-js';

async function testSignIn() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'adminpramana@gmail.com',
    password: 'Taanu@29082008',
  });

  if (error) {
    console.error('Sign-in FAILED:', error.message);
  } else {
    console.log('Sign-in SUCCESSFUL! User:', data.user.id, data.user.email);
    console.log('Session access token present:', !!data.session.access_token);
  }
}

testSignIn().catch(console.error);
