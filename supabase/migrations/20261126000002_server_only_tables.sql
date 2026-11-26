-- Clinical, institutional and audit records are served by authorized server actions.
-- Keep browser CRUD closed. Existing policies are left intact, while this
-- restrictive policy ensures none of them can grant browser access.
do $$
declare relation text;
begin
  foreach relation in array array[
    'allergies','audit_logs','clinical_documents','clinical_entities','clinical_reviews',
    'consent_records','discharge_instructions','discharge_translations','document_versions',
    'encounters','evidence_edges','evidence_nodes','extraction_jobs','handoff_reviews',
    'lab_results','medications','organization_members','organizations','patients',
    'professional_attestations','profiles','safety_alerts','safety_rule_versions','safety_rules',
    'patient_account_links'
  ] loop
    execute format('revoke all privileges on table public.%I from public,anon,authenticated',relation);
    execute format('drop policy if exists server_access_only on public.%I',relation);
    execute format('create policy server_access_only on public.%I as restrictive for all to anon,authenticated using(false) with check(false)',relation);
  end loop;
end $$;
