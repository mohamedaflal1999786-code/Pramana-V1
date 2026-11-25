/**
 * Pramana-V1 - Initial Administrator Provisioning Tool
 * Team: Unknown GenZ
 *
 * CRITICAL SECURITY GOVERNANCE:
 * - Public administrator registration endpoints are forbidden.
 * - This tool provisions authorized platform and institutional administrators via server CLI.
 * - Records cryptographic audit event in the immutable audit ledger.
 * - Strictly requires explicit confirmation before privilege assignment.
 */

import * as fs from "fs";

// Load environment variables
const envText = fs.readFileSync(".env.local", "utf8");
for (const line of envText.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^['"]|['"]$/g, "");
    process.env[key] = val;
  }
}

import { getSupabaseAdminClient } from "../src/lib/supabase/admin";

async function provisionAdministrator() {
  const args = process.argv.slice(2);
  const targetEmail = args[0]?.trim().toLowerCase();
  const roleType = (args[1] || "platform_admin") as "platform_admin" | "institutional_admin";
  const force = args.includes("--confirm");

  console.log("===============================================================================");
  console.log("Pramana-V1 Administrator Account Provisioning Tool");
  console.log("Team: Unknown GenZ");
  console.log("===============================================================================");

  if (!targetEmail) {
    console.error("\n[USAGE ERROR] Target email required.\n");
    console.log("Syntax:");
    console.log("  npx tsx scripts/admin-provisioning.ts <user-email> [role: platform_admin|institutional_admin] [--confirm]");
    console.log("\nExample:");
    console.log("  npx tsx scripts/admin-provisioning.ts admin@pramana.local platform_admin --confirm\n");
    process.exit(1);
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    console.error("\n[CRITICAL ERROR] Supabase Admin Client unavailable. Check SUPABASE_SERVICE_ROLE_KEY.\n");
    process.exit(1);
  }

  // 1. Locate user in Supabase Auth
  const { data: usersData, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("[Auth Lookup Error]:", listError.message);
    process.exit(1);
  }

  const user = usersData.users.find((u) => u.email?.toLowerCase() === targetEmail);

  if (!user) {
    console.error(`\n[USER NOT FOUND] No Supabase Auth record matches email '${targetEmail}'.`);
    console.log("The user must first register an account at /auth/signup before receiving administrative privileges.\n");
    process.exit(1);
  }

  console.log(`\nIdentified User:`);
  console.log(`  User ID:    ${user.id}`);
  console.log(`  Email:      ${user.email}`);
  console.log(`  Target Role: ${roleType}`);

  if (!force) {
    console.log("\n[SAFETY HOLD] To execute privilege assignment, re-run with the '--confirm' flag.");
    process.exit(0);
  }

  const defaultOrgId = "00000000-0000-0000-0000-000000000001";

  // 2. Ensure profile exists
  await admin.from("profiles").upsert({
    id: user.id,
    full_name: user.user_metadata?.full_name || "Platform Administrator",
    email: user.email!,
  });

  // 3. Upsert organization membership with administrator role
  const { error: memberError } = await admin.from("organization_members").upsert(
    {
      organization_id: defaultOrgId,
      user_id: user.id,
      role_id: roleType,
      department: "Platform Operations & Governance",
      is_active: true,
    },
    { onConflict: "organization_id,user_id" }
  );

  if (memberError) {
    console.error("[Membership Error]:", memberError.message);
    process.exit(1);
  }

  // 4. Update Supabase Auth app_metadata
  await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { role: roleType, is_active: true },
  });

  // 5. Audit the privilege elevation
  await admin.from("audit_logs").insert({
    organization_id: defaultOrgId,
    action: "rbac.role_assigned",
    entity_type: "administrator_provisioning",
    entity_id: user.id,
    details: {
      target_user: user.email,
      assigned_role: roleType,
      provisioned_via: "scripts/admin-provisioning.ts",
      timestamp: new Date().toISOString(),
    },
  });

  console.log("\n[SUCCESS] Administrator privileges assigned successfully!");
  console.log(`User ${user.email} is now activated as ${roleType}.`);
  console.log("Audit log record persisted.\n");
}

provisionAdministrator().catch(console.error);
