# Pramana-V1 Environment Configuration & Supabase Deployment Guide
**Project**: Pramana-V1 ("Every Alert. Backed by Evidence.")  
**Team**: Unknown GenZ  
**Phase**: Phase 03 — Production-Oriented Database and Storage Infrastructure  

---

## 1. Environment Variable Architecture

Pramana-V1 uses environment variables partitioned by execution tier and privilege:

| Variable | Environment | Security Scope | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | Client & Server | Public | Application title branding |
| `NEXT_PUBLIC_APP_URL` | Client & Server | Public | Base canonical origin URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Public | Supabase project API gateway endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Public (RLS Guarded) | Supabase anonymous/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | **Confidential Secret** | Privileged service key for isolated backend tasks |
| `NEXT_PUBLIC_STORAGE_BUCKET_*` | Client & Server | Public | Canonical storage bucket names |

> [!CAUTION]
> **Zero Exposure Guarantee**: `SUPABASE_SERVICE_ROLE_KEY` must **NEVER** be committed to Git, bundled into client-side code, or logged in console traces. It is restricted strictly to isolated server utilities (`src/lib/supabase/admin.ts`).

---

## 2. Step-by-Step Supabase Project Setup

### Option A: Hosted Supabase Project (Recommended for Staging)
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project named `pramana-v1-staging` (choose region closest to clinical users).
3. Navigate to **Project Settings** -> **API**:
   - Copy **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy **anon public** key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Copy **service_role secret** -> `SUPABASE_SERVICE_ROLE_KEY`.
4. Open the **SQL Editor** in Supabase and execute the migration files located in `supabase/migrations/` in numerical order:
   - `001_institutional_management.sql`
   - `002_patient_and_encounters.sql`
   - `003_clinical_intelligence.sql`
   - `004_safety_provenance_graph.sql`
   - `005_professional_verification.sql`
   - `006_platform_governance.sql`
   - `007_storage_buckets.sql`
   - `008_row_level_security.sql`
5. Verify Storage Buckets in **Storage** pane:
   - `clinical-documents` (Private, 25MB limit)
   - `extracted-artifacts` (Private, 25MB limit)
   - `discharge-exports` (Private, 25MB limit)
6. Add the credentials to your local `.env.local` file (which is gitignored).

---

## 3. Local Development Validation
To verify database configuration and security policies locally without a live remote connection:
```bash
npm run test:db
# or
npx tsx scripts/test-database.ts
```
Expected output:
```
Total Automated Tests Executed: 15
Passed: 15
Failed: 0
```
