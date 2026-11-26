import { PGlite } from "@electric-sql/pglite";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";

const db = new PGlite();
const [org,otherOrg,doctor,pharmacist,admin,patient,outsider,alert] = Array.from({length:8},()=>randomUUID());
const rows=async(sql,args)=>(await db.query(sql,args)).rows;
async function actor(id) { await db.exec("reset role");await db.query("select set_config('test.actor',$1,false)",[id]);await db.exec("set role authenticated"); }
try {
  await db.exec("create role service_role;create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select current_setting('test.actor',true)::uuid$$;grant usage on schema auth to authenticated;");
  await db.exec(readFileSync(new URL("./fixtures/patient-access-schema.sql",import.meta.url),"utf8"));
  await db.exec(readFileSync(new URL("../supabase/migrations/20261126000001_patient_access.sql",import.meta.url),"utf8"));
  // The metadata fixture includes the tables exercised by workflow tests.
  for(const name of ["allergies","handoff_reviews","lab_results","medications","organizations","professional_attestations","safety_rules","safety_rule_versions"]) await db.exec("create table public."+name+"(id uuid primary key)");
  await db.exec(readFileSync(new URL("../supabase/migrations/20261126000002_server_only_tables.sql",import.meta.url),"utf8"));
  const key="a".repeat(64);
  assert.equal((await rows("select allow_auth_request($1,1) allowed",[key]))[0].allowed,true);
  assert.equal((await rows("select allow_auth_request($1,1) allowed",[key]))[0].allowed,false);
  for (const [id,role,tenant] of [[doctor,"doctor",org],[pharmacist,"pharmacist",org],[admin,"institutional_admin",org],[patient,"patient",org],[outsider,"doctor",otherOrg]]) {
    await db.query("insert into auth.users values($1,now())",[id]);
    await db.query("insert into profiles(id,full_name,email) values($1,'Fixture','fixture@example.invalid')",[id]);
    await db.query("insert into organization_members(organization_id,user_id,role_id) values($1,$2,$3)",[tenant,id,role]);
  }
  await actor(doctor);
  const register="select register_care_patient($1,'Isolated','Fixture','2000-01-01',$2) as pid";
  await assert.rejects(rows(register,[org,false]));
  await assert.rejects(rows(register,[otherOrg,true]));
  const [{pid}]=await rows(register,[org,true]);
  await db.exec("reset role");
  await db.query("insert into safety_alerts(id,organization_id,patient_id,title,severity,summary) values($1,$2,$3,'Fixture','low','Fixture')",[alert,org,pid]);
  const [{mrn}]=await rows("select mrn from patients where id=$1",[pid]);
  const review="select review_care_alert($1,'endorsed',$2)";
  await actor(outsider);await assert.rejects(rows(review,[alert,"Fixture rationale"]));
  await actor(pharmacist);await assert.rejects(rows(review,[alert,"Fixture rationale"]));
  await actor(admin);
  const assign="select assign_care_access($1,$2,$3,$4)";
  await assert.rejects(rows(assign,[org,mrn,patient,false]));
  await rows(assign,[org,mrn,patient,true]);await rows(assign,[org,mrn,pharmacist,true]);
  await actor(pharmacist);await assert.rejects(rows(review,[alert," "]));await rows(review,[alert,"Fixture rationale"]);await assert.rejects(rows(review,[alert,"Repeat"]));
  await actor(doctor);const [{tid}]=await rows("select save_discharge_draft($1,$2,'ta','Fixture source','Fixture translation') tid",[org,pid]);
  await actor(patient);await assert.rejects(rows("select approve_discharge_draft($1,'Fixture review')",[tid]));
  await actor(doctor);await rows("select approve_discharge_draft($1,'Fixture review')",[tid]);
  await db.exec("reset role");
  assert.equal((await rows("select reviewer_role from clinical_reviews"))[0].reviewer_role,"pharmacist");
  assert.equal((await rows("select count(*)::int n from audit_logs where action='clinical.review'"))[0].n,1);
  assert.equal((await rows("select is_professionally_approved from discharge_translations"))[0].is_professionally_approved,true);
  const doc=randomUUID(), digest="a".repeat(64), path=org+"/"+pid+"/fixture.pdf";
  const upload="select * from record_uploaded_version($1,$2,$3,$4,null,'Fixture','discharge_summary','application/pdf',10,$5,$6,$7)";
  const input=[org,pid,doctor,doc,path,digest,true];
  const [v1]=await rows(upload,input);
  assert.equal(v1.version_no,1);
  const [job]=await rows("insert into extraction_jobs(organization_id,document_version_id,status,model_version) values($1,$2,'processing','fixture-model') returning id",[org,v1.version_id]);
  const entity={id:randomUUID(),entityType:"observation",name:"fixture",sourceLocation:{rawQuote:"fixture",documentId:doc,versionNumber:1}};
  const finding={id:randomUUID(),severity:"low",title:"Fixture",summary:"Fixture",evidenceNodeIds:[entity.id]};
  const finish="select finish_grounded_analysis($1,$2,$3::jsonb,$4::jsonb,'{}')";
  await assert.rejects(rows(finish,[job.id,outsider,JSON.stringify([entity]),JSON.stringify([finding])]));
  await assert.rejects(rows(finish,[job.id,doctor,JSON.stringify([entity]),JSON.stringify([{...finding,evidenceNodeIds:[randomUUID()]}])]));
  assert.equal((await rows("select count(*)::int n from clinical_entities"))[0].n,0);
  await rows(finish,[job.id,doctor,JSON.stringify([entity]),JSON.stringify([finding])]);
  assert.equal((await rows("select count(*)::int n from evidence_edges"))[0].n,3);
  await assert.rejects(rows(upload,[...input.slice(0,-1),false]));
  const [v2]=await rows(upload,[org,pid,doctor,doc,path+"2","b".repeat(64),false]);assert.equal(v2.version_no,2);
  await actor(outsider);assert.equal((await rows("select * from patient_care_access")).length,0);
  console.log("Patient registration, consent, isolation, identity link, review, approval and audit checks passed in isolated PostgreSQL.");
} finally { await db.close(); }
