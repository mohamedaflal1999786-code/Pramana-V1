# Pramana-V1 — Administrator Provisioning & Onboarding Guide
**Team:** Unknown GenZ  
**Phase:** 04 — Production-Oriented Authentication, Identity Management & RBAC  
**Scope:** Initial Platform Administrator & Institutional Administrator Provisioning  

---

## 1. Governance Principles

To maintain strict healthcare security standards:
- **No Public Administrator Registration:** There is no public registration form or URL parameter to create administrator accounts.
- **No Self-Elevation:** Users cannot assign themselves administrator roles via frontend forms or metadata.
- **Audit Requirement:** All administrative elevations are recorded in the PostgreSQL `audit_logs` table.
- **Explicit Approval:** Initial administrator accounts are provisioned exclusively via authorized server CLI workflows.

---

## 2. Initial Administrator Provisioning Workflow

### Step 1: User Registers Account
The intended administrator must first register their account using their institutional email address:
1. Navigate to `http://localhost:3000/auth/signup`
2. Enter Full Name, Institutional Email, Health System, and set a strong password meeting healthcare entropy requirements.
3. Submit registration. The user is placed into `pending` status.

### Step 2: Request User Approval
Antigravity will request explicit confirmation before granting administrator privileges.

### Step 3: Execute Provisioning Tool
Once approved, execute the provisioning CLI command in the integrated terminal:

```powershell
npx tsx scripts/admin-provisioning.ts <user-email> platform_admin --confirm
```

#### Command Arguments
- `<user-email>`: The registered email address of the administrator (e.g. `admin@pramana.local`).
- `[role]`: Either `platform_admin` (global control) or `institutional_admin` (hospital tenancy governance). Defaults to `platform_admin`.
- `--confirm`: Mandatory safety flag. Without this flag, the script performs a dry-run lookup without changing privileges.

#### Provisioning Actions Executed
1. Locates the user in `auth.users`.
2. Upserts profile in `public.profiles`.
3. Creates active membership in `public.organization_members` with `is_active = true` and `role_id = 'platform_admin'`.
4. Updates Supabase Auth `app_metadata` with `{ role: 'platform_admin', is_active: true }`.
5. Inserts an immutable audit record in `public.audit_logs`.

---

## 3. Routine Institutional Governance (via Web Console)

Once an administrator account is active, all subsequent clinician onboarding, approvals, and suspensions are managed directly within the web workspace:

1. Sign in to `/workspaces/admin`.
2. Navigate to the **Institutional User Directory & Account Approvals** section.
3. View pending registrations in the roster.
4. Click **Approve** to activate a clinician, or **Suspend** to instantly revoke clinical access.
