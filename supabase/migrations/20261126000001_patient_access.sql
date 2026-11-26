-- Explicit assignments are empty until an authorized clinician registers a patient
-- or institutional staff verify an existing care relationship.
create table public.patient_care_access (
  organization_id uuid not null,
  patient_id uuid not null,
  user_id uuid not null,
  primary key (organization_id, patient_id, user_id),
  foreign key (patient_id, organization_id) references public.patients(id, organization_id),
  foreign key (organization_id, user_id) references public.organization_members(organization_id, user_id)
);
alter table public.patient_care_access enable row level security;
revoke all on public.patient_care_access from public, anon, authenticated;
grant select on public.patient_care_access to authenticated;
create policy own_assignments on public.patient_care_access for select to authenticated using (user_id = (select auth.uid()));

create function public.register_care_patient(p_org uuid, p_first text, p_last text, p_birth date, p_consent boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare pid uuid := gen_random_uuid(); actor uuid := auth.uid();
begin
  if not exists (select 1 from public.organization_members where organization_id=p_org and user_id=actor and is_active and role_id='doctor' for share)
     or not exists (select 1 from auth.users where id=actor and email_confirmed_at is not null)
     then raise exception 'Active doctor membership required'; end if;
  if p_consent is not true or coalesce(length(trim(p_first)),0) not between 1 and 100
    or coalesce(length(trim(p_last)),0) not between 1 and 100 or p_birth is null or p_birth > current_date then raise exception 'Invalid registration'; end if;
  insert into public.patients(id,organization_id,mrn,first_name,last_name,date_of_birth,is_synthetic)
    values(pid,p_org,'PRM-'||pid,trim(p_first),trim(p_last),p_birth,false);
  insert into public.patient_care_access values(p_org,pid,actor);
  insert into public.consent_records(organization_id,patient_id,consent_type,status,granted_by)
    values(p_org,pid,'treatment_summary_access','granted',actor);
  insert into public.audit_logs(organization_id,action,entity_type,entity_id,details)
    values(p_org,'patient.registered','patient',pid,jsonb_build_object('recorded_by',actor));
  return pid;
end $$;

create function public.review_care_alert(p_alert uuid, p_decision text, p_rationale text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare a public.safety_alerts%rowtype; actor uuid := auth.uid(); reviewer text; review_id uuid;
begin
  if p_decision is null or p_decision not in ('endorsed','rejected','clarification_requested')
    or coalesce(length(trim(p_rationale)),0) not between 1 and 4000 then raise exception 'Decision and rationale required'; end if;
  select s.* into a from public.safety_alerts s join public.patient_care_access g using(organization_id,patient_id)
    where s.id=p_alert and g.user_id=actor for update of s for share of g;
  select m.role_id into reviewer from public.organization_members m join auth.users u on u.id=m.user_id
    where m.organization_id=a.organization_id and u.id=actor and u.email_confirmed_at is not null and m.is_active and m.role_id in ('doctor','pharmacist') for share of m;
  if reviewer is null then raise exception 'Review unavailable'; end if;
  if a.status is null or a.status not in ('pending_review','unverified','clarification_requested','open') then raise exception 'Review already closed'; end if;
  insert into public.clinical_reviews(organization_id,alert_id,reviewer_id,reviewer_role,review_decision,clinical_rationale)
    values(a.organization_id,a.id,actor,reviewer,p_decision,trim(p_rationale)) returning id into review_id;
  update public.safety_alerts set status=p_decision,updated_at=now() where id=a.id;
  insert into public.audit_logs(organization_id,action,entity_type,entity_id,details)
    values(a.organization_id,'clinical.review','clinical_review',review_id,jsonb_build_object('actor',actor,'role',reviewer,'alert',a.id,'decision',p_decision));
  return review_id;
end $$;
revoke all on function public.register_care_patient(uuid,text,text,date,boolean), public.review_care_alert(uuid,text,text) from public, anon;
grant execute on function public.register_care_patient(uuid,text,text,date,boolean), public.review_care_alert(uuid,text,text) to authenticated;

create table public.patient_account_links (
  organization_id uuid not null,
  patient_id uuid not null,
  user_id uuid not null,
  verified_by uuid not null references public.profiles(id),
  verified_at timestamptz not null default now(),
  primary key (organization_id,patient_id),
  unique (organization_id,user_id),
  foreign key (patient_id,organization_id) references public.patients(id,organization_id),
  foreign key (organization_id,user_id) references public.organization_members(organization_id,user_id)
);
alter table public.patient_account_links enable row level security;
revoke all on public.patient_account_links from public, anon, authenticated;

create function public.assign_care_access(p_org uuid,p_mrn text,p_account uuid,p_identity_verified boolean) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); pid uuid; target_role text;
begin
  if p_identity_verified is not true or not exists(select 1 from public.organization_members m join auth.users u on u.id=m.user_id
    where u.id=actor and u.email_confirmed_at is not null and m.organization_id=p_org and m.is_active and m.role_id in ('institutional_admin','platform_admin') for share of m)
    then raise exception 'Administrative verification required'; end if;
  select id into strict pid from public.patients where organization_id=p_org and mrn=p_mrn;
  select m.role_id into strict target_role from public.organization_members m join auth.users u on u.id=m.user_id
    where m.organization_id=p_org and m.user_id=p_account and m.is_active and u.email_confirmed_at is not null for share of m;
  if target_role='patient' then
    insert into public.patient_account_links(organization_id,patient_id,user_id,verified_by) values(p_org,pid,p_account,actor);
  elsif target_role in ('doctor','pharmacist') then
    insert into public.patient_care_access values(p_org,pid,p_account) on conflict do nothing;
  else raise exception 'Invalid account role'; end if;
  insert into public.audit_logs(organization_id,action,entity_type,entity_id,details)
    values(p_org,'patient.access_assigned','patient',pid,jsonb_build_object('actor',actor,'account',p_account,'role',target_role));
end $$;
revoke all on function public.assign_care_access(uuid,text,uuid,boolean) from public,anon;
grant execute on function public.assign_care_access(uuid,text,uuid,boolean) to authenticated;

alter table public.discharge_instructions add column source_instructions text;
create function public.save_discharge_draft(p_org uuid,p_patient uuid,p_language text,p_source text,p_translation text)
returns uuid language plpgsql security definer set search_path='' as $$
declare instruction uuid; translation uuid; actor uuid := auth.uid();
begin
  if not exists(select 1 from public.patient_care_access a join public.organization_members m using (organization_id,user_id)
    join auth.users u on u.id=m.user_id where u.id=actor and u.email_confirmed_at is not null and m.is_active and m.role_id='doctor'
    and a.organization_id=p_org and a.patient_id=p_patient for share of a,m)
    then raise exception 'Assigned doctor required'; end if;
  if p_language is null or p_language not in ('en','ta','hi','te','ml','kn','es','ar','zh')
    or coalesce(length(trim(p_source)),0) not between 1 and 16000 or coalesce(length(trim(p_translation)),0) not between 1 and 32000
    then raise exception 'Invalid draft'; end if;
  insert into public.discharge_instructions(organization_id,patient_id,source_instructions,is_verified)
    values(p_org,p_patient,p_source,false) returning id into instruction;
  insert into public.discharge_translations(organization_id,instruction_id,language_code,translated_content,is_professionally_approved)
    values(p_org,instruction,p_language,jsonb_build_object('instructions',p_translation),false) returning id into translation;
  return translation;
end $$;
create function public.approve_discharge_draft(p_id uuid,p_rationale text) returns void language plpgsql security definer set search_path='' as $$
declare org uuid; instruction uuid; actor uuid:=auth.uid();
begin
  if coalesce(length(trim(p_rationale)),0) not between 1 and 4000 then raise exception 'Review rationale required'; end if;
  select t.organization_id,t.instruction_id into strict org,instruction from public.discharge_translations t
    join public.discharge_instructions i on i.id=t.instruction_id and i.organization_id=t.organization_id
    join public.patient_care_access a on a.organization_id=i.organization_id and a.patient_id=i.patient_id
    join public.organization_members m on m.organization_id=a.organization_id and m.user_id=a.user_id join auth.users u on u.id=m.user_id
    where t.id=p_id and not t.is_professionally_approved and m.is_active and m.role_id='doctor' and u.id=actor and u.email_confirmed_at is not null for update of t for share of a,m;
  update public.discharge_translations set is_professionally_approved=true,approved_by=actor,approved_at=now() where id=p_id;
  update public.discharge_instructions set is_verified=true,verified_by=actor,updated_at=now() where id=instruction;
  insert into public.audit_logs(organization_id,action,entity_type,entity_id,details) values(org,'discharge.approved','translation',p_id,jsonb_build_object('reviewer',actor,'rationale',trim(p_rationale)));
end $$;
revoke all on function public.save_discharge_draft(uuid,uuid,text,text,text),public.approve_discharge_draft(uuid,text) from public,anon;
grant execute on function public.save_discharge_draft(uuid,uuid,text,text,text),public.approve_discharge_draft(uuid,text) to authenticated;

alter table public.clinical_documents add column encounter_id uuid references public.encounters(id);

-- Only the application server can persist model output. End-user credentials cannot call this function.
create function public.finish_grounded_analysis(p_job uuid,p_actor uuid,p_entities jsonb,p_findings jsonb,p_metadata jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare job public.extraction_jobs%rowtype; doc public.clinical_documents%rowtype; ver public.document_versions%rowtype;
  entity jsonb; finding jsonb; eid uuid; span_id uuid; version_node uuid:=gen_random_uuid(); finding_node uuid; ref text;
begin
  select * into strict job from public.extraction_jobs where id=p_job and status='processing' for update;
  select * into strict ver from public.document_versions where id=job.document_version_id and organization_id=job.organization_id for update;
  select * into strict doc from public.clinical_documents where id=ver.document_id and organization_id=ver.organization_id and current_version_number=ver.version_number for share;
  if not exists(select 1 from public.patient_care_access a join public.organization_members m using(organization_id,user_id)
    join auth.users u on u.id=m.user_id where a.patient_id=doc.patient_id and a.organization_id=doc.organization_id and m.user_id=p_actor and m.is_active and m.role_id in ('doctor','pharmacist') and u.email_confirmed_at is not null for share of a,m)
    then raise exception 'Assignment unavailable'; end if;
  if exists(select 1 from public.extraction_jobs where document_version_id=ver.id and status='completed' and model_version=job.model_version) then raise exception 'Version already analyzed'; end if;
  insert into public.evidence_nodes(id,organization_id,patient_id,node_type,reference_id,label,metadata)
    values(version_node,doc.organization_id,doc.patient_id,'document_version',ver.id,doc.title,jsonb_build_object('sha256',ver.sha256_hash,'documentId',doc.id,'versionNumber',ver.version_number));
  for entity in select * from jsonb_array_elements(p_entities) loop
    eid:=(entity->>'id')::uuid; span_id:=gen_random_uuid();
    if nullif(trim(entity#>>'{sourceLocation,rawQuote}'),'') is null then raise exception 'Evidence missing'; end if;
    insert into public.clinical_entities(id,organization_id,document_version_id,patient_id,entity_type,raw_text,normalized_name,source_location,is_verified)
      values(eid,doc.organization_id,ver.id,doc.patient_id,entity->>'entityType',entity#>>'{sourceLocation,rawQuote}',entity->>'name',entity->'sourceLocation',false);
    insert into public.evidence_nodes(id,organization_id,patient_id,node_type,reference_id,label,metadata) values
      (eid,doc.organization_id,doc.patient_id,'clinical_entity',eid,entity->>'name','{}'),
      (span_id,doc.organization_id,doc.patient_id,'evidence_span',ver.id,entity#>>'{sourceLocation,rawQuote}',entity->'sourceLocation');
    insert into public.evidence_edges(organization_id,patient_id,source_node_id,target_node_id,relationship_type) values
      (doc.organization_id,doc.patient_id,eid,span_id,'SUPPORTED_BY'),(doc.organization_id,doc.patient_id,span_id,version_node,'EXTRACTED_FROM');
  end loop;
  for finding in select * from jsonb_array_elements(p_findings) loop
    finding_node:=gen_random_uuid();
    insert into public.safety_alerts(id,organization_id,patient_id,severity,title,summary,status)
      values((finding->>'id')::uuid,doc.organization_id,doc.patient_id,finding->>'severity',finding->>'title',finding->>'summary','pending_review');
    insert into public.evidence_nodes(id,organization_id,patient_id,node_type,reference_id,label,metadata)
      values(finding_node,doc.organization_id,doc.patient_id,'clinical_finding',(finding->>'id')::uuid,finding->>'title',jsonb_build_object('ruleCode',finding->>'ruleCode','reviewStatus','unverified'));
    for ref in select jsonb_array_elements_text(finding->'evidenceNodeIds') loop
      if not exists(select 1 from jsonb_array_elements(p_entities) e where e->>'id'=ref) then raise exception 'Evidence outside analysis'; end if;
      insert into public.evidence_edges(organization_id,patient_id,source_node_id,target_node_id,relationship_type) values(doc.organization_id,doc.patient_id,ref::uuid,finding_node,'TRIGGERED');
    end loop;
  end loop;
  update public.extraction_jobs set status='completed',completed_at=now(),metadata=p_metadata where id=p_job;
  insert into public.audit_logs(organization_id,action,entity_type,entity_id,details)
    values(doc.organization_id,'ai.document_analyzed','extraction_job',p_job,jsonb_build_object('actor',p_actor,'version',ver.id));
end $$;
revoke all on function public.finish_grounded_analysis(uuid,uuid,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.finish_grounded_analysis(uuid,uuid,jsonb,jsonb,jsonb) to service_role;

create function public.record_uploaded_version(p_org uuid,p_patient uuid,p_actor uuid,p_document uuid,p_encounter uuid,p_title text,p_kind text,p_mime text,p_bytes bigint,p_path text,p_hash text,p_new boolean)
returns table(version_id uuid,version_no integer,job_id uuid) language plpgsql security definer set search_path='' as $$
declare next_no int; vid uuid:=gen_random_uuid(); jid uuid:=gen_random_uuid();
begin
  if not exists(select 1 from public.patient_care_access a join public.organization_members m using(organization_id,user_id)
    join auth.users u on u.id=m.user_id where a.patient_id=p_patient and a.organization_id=p_org and m.user_id=p_actor and m.is_active and m.role_id in ('doctor','pharmacist') and u.email_confirmed_at is not null for share of a,m)
    then raise exception 'Assignment unavailable'; end if;
  if p_path not like p_org::text||'/'||p_patient::text||'/%' or p_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid file identity'; end if;
  if p_encounter is not null and not exists(select 1 from public.encounters where organization_id=p_org and patient_id=p_patient and id=p_encounter) then raise exception 'Invalid encounter'; end if;
  if p_new then
    next_no:=1;
    insert into public.clinical_documents(id,organization_id,patient_id,encounter_id,title,document_type,mime_type,file_size_bytes,storage_path,current_version_number,quarantine_status)
    values(p_document,p_org,p_patient,p_encounter,p_title,p_kind,p_mime,p_bytes,p_path,next_no,'validated');
  else
    select current_version_number+1 into strict next_no from public.clinical_documents where id=p_document and organization_id=p_org and patient_id=p_patient for update;
    if exists(select 1 from public.document_versions where document_id=p_document and sha256_hash=p_hash) then raise exception 'Duplicate version'; end if;
    update public.clinical_documents set current_version_number=next_no,storage_path=p_path,mime_type=p_mime,file_size_bytes=p_bytes,updated_at=now() where id=p_document;
  end if;
  insert into public.document_versions(id,organization_id,document_id,version_number,sha256_hash,storage_path) values(vid,p_org,p_document,next_no,p_hash,p_path);
  insert into public.extraction_jobs(id,organization_id,document_version_id,status,model_version,started_at) values(jid,p_org,vid,'processing','pramana-extractor-v1.2.0',now());
  return query select vid,next_no,jid;
end $$;
revoke all on function public.record_uploaded_version(uuid,uuid,uuid,uuid,uuid,text,text,text,bigint,text,text,boolean) from public,anon,authenticated;
grant execute on function public.record_uploaded_version(uuid,uuid,uuid,uuid,uuid,text,text,text,bigint,text,text,boolean) to service_role;

create schema if not exists pramana_private;
revoke all on schema pramana_private from public,anon,authenticated;
create table pramana_private.request_windows(key_hash text primary key,started_at timestamptz not null,hits integer not null);
create index request_windows_expiry on pramana_private.request_windows(started_at);
create function public.allow_auth_request(p_key text,p_limit integer) returns boolean language plpgsql security definer set search_path='' as $$
declare amount integer;
begin
  if p_key !~ '^[0-9a-f]{64}$' or p_limit not between 1 and 100 then return false; end if;
  delete from pramana_private.request_windows where started_at < now()-interval '2 minutes';
  insert into pramana_private.request_windows as w values(p_key,now(),1)
    on conflict(key_hash) do update set hits=case when w.started_at <= now()-interval '1 minute' then 1 else least(w.hits+1,101) end,
    started_at=case when w.started_at <= now()-interval '1 minute' then now() else w.started_at end returning hits into amount;
  return amount<=p_limit;
end $$;
revoke all on function public.allow_auth_request(text,integer) from public,anon,authenticated;
grant execute on function public.allow_auth_request(text,integer) to service_role;
