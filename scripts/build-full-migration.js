const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
let combined = '-- ==============================================================================\n' +
               '-- Pramana-V1 Consolidated Database Schema & RLS Migrations (Phase 03)\n' +
               '-- Project: Pramana-V1 ("Every Alert. Backed by Evidence.")\n' +
               '-- Team: Unknown GenZ\n' +
               '-- Target: Supabase PostgreSQL (Project dvdhfonmvbhphvrwdlxn)\n' +
               '-- Contains: 31 Relational Tables, 48 RLS Policies, 3 Storage Buckets, Triggers\n' +
               '-- ==============================================================================\n\n';

for (const file of files) {
  combined += '\n\n-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';
  combined += '-- FILE: ' + file + '\n';
  combined += '-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n\n';
  let content = fs.readFileSync(path.join(dir, file), 'utf8');

  // Make policies idempotent: prepend DROP POLICY IF EXISTS before CREATE POLICY
  content = content.replace(/CREATE POLICY\s+"([^"]+)"\s+ON\s+([a-zA-Z0-9_\.]+)/g, (match, policyName, tableName) => {
    return `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};\nCREATE POLICY "${policyName}" ON ${tableName}`;
  });

  combined += content;
}

const outPath = path.join(__dirname, '..', 'supabase', 'full_schema_migration.sql');
fs.writeFileSync(outPath, combined);
console.log('Successfully generated idempotent full_schema_migration.sql with size:', combined.length, 'bytes');
