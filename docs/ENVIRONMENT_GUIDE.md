# Pramana-V1 — Environment Configuration Guide
**Team:** Unknown GenZ  
**Security Classification:** Strict Confidentiality — Never Commit Real Credentials  

---

## 1. Environment Variable Architecture

Pramana-V1 utilizes a dual-tier environment configuration designed for Next.js App Router and Supabase SSR (`@supabase/ssr`):

| Variable Name | Exposure | Required Environment | Description |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Public** (Browser & Server) | Local & Production | HTTPS API endpoint of the Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Public** (Browser & Server) | Local & Production | Standard publishable key with Row Level Security (RLS) enforcement |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Public** (Browser & Server) | Local & Production | Modern alias for the Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Private** (Server-Side Only) | Local & Production | Privileged service-role key for background audits and administrative tasks |
| `NEXT_PUBLIC_SITE_URL` | **Public** (Browser & Server) | Local & Production | Canonical URL for auth redirects and email callbacks (e.g. `http://localhost:3000` or production domain) |

---

## 2. Local Development Configuration (`.env.local`)

Place this file in the project root. **Never commit `.env.local` to Git.**

```env
# ==============================================================================
# Pramana-V1 Local Environment Configuration
# Team: Unknown GenZ
# ==============================================================================

# Supabase Project Endpoint
NEXT_PUBLIC_SUPABASE_URL=https://dvdhfonmvbhphvrwdlxn.supabase.co

# Supabase Publishable / Anon Key (Safe for browser clients)
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ftQ7nIJ35veZkwh44XSLIg_mNp_G-dE
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ftQ7nIJ35veZkwh44XSLIg_mNp_G-dE

# Supabase Privileged Service-Role Key (STRICTLY SERVER-SIDE ONLY)
# Never expose to client bundles, NEXT_PUBLIC variables, or public repositories
SUPABASE_SERVICE_ROLE_KEY=sb_secret_**********************************p4

# Canonical Base URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 3. Security Restrictions & Verification

1. **Client Isolation:** The privileged `SUPABASE_SERVICE_ROLE_KEY` is loaded exclusively by `src/lib/supabase/admin.ts` and server actions. It includes runtime guards throwing critical exceptions if accessed in browser contexts (`typeof window !== 'undefined'`).
2. **Git Protection:** `.gitignore` includes `.env*`, `.env.local`, and sensitive credential files.
3. **Automated Scanning:** Automated test `test-phase4-auth.ts` scans all source files before builds to ensure zero secret leakage.
