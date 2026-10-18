// Disposable PostgreSQL fixture. Never connects to the production Supabase project.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
if (!process.argv[2])
  throw new Error(
    "Pass the PGlite module path (see docs/human-verification.md).",
  );
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const user = "00000000-0000-0000-0000-000000000001",
  other = "00000000-0000-0000-0000-000000000002";
const sid = "10000000-0000-0000-0000-000000000001",
  otherSid = "10000000-0000-0000-0000-000000000002";
const school = "20000000-0000-0000-0000-000000000001";
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create schema storage; create schema extensions;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
    create table auth.sessions(id uuid primary key,user_id uuid references auth.users);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    create table public.profiles(id uuid primary key,school_verified_at timestamptz,badge text);
    create table public.account_trust(user_id uuid primary key references auth.users,human_verified_at timestamptz not null default now());
    create function public.mark_human_verified() returns trigger language plpgsql security definer as $$ begin insert into public.account_trust(user_id) values(new.id) on conflict do nothing; return new; end; $$;
    create trigger on_auth_user_email_confirmed after insert or update of email_confirmed_at on auth.users for each row execute function public.mark_human_verified();
    create table public.schools(id uuid primary key,active boolean,email_domains text[]);
    create table public.verification_requests(id uuid primary key default gen_random_uuid(),user_id uuid,method text,status text,role text,school_id uuid,school_email text,email_verified_at timestamptz,id_path text,created_at timestamptz default now());
    create table public.school_email_codes(user_id uuid,request_id uuid,expires_at timestamptz,attempts int,code_hash bytea);
    create table public.verification_events(request_id uuid,actor uuid,event text,detail text);
    create table storage.objects(bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant usage on schema public,storage,auth to authenticated;
    grant insert on storage.objects to authenticated;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
    create function public.set_location(p_lat double precision,p_lng double precision) returns void language plpgsql as $$ begin null; end; $$;
    create function public.nearby_users(radius_m int default 40234) returns table(display_name text,distance_bucket text) language sql as $$ select 'fixture'::text,'fixture'::text $$;
    create function public.stop_sharing() returns void language plpgsql as $$ begin null; end; $$;
  `);
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/004_verification_progress.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/005_human_verification.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  // Re-applying must not re-wrap the already-gated location functions or restore the old email trigger.
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/005_human_verification.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.query("insert into auth.users values($1,now()),($2,now())", [
    user,
    other,
  ]);
  assert.equal(
    (await db.query("select count(*)::int as n from public.account_trust"))
      .rows[0].n,
    0,
    "email must not mark human",
  );
  await db.query("insert into auth.sessions values($1,$2),($3,$4)", [
    sid,
    user,
    otherSid,
    other,
  ]);
  await db.query(
    "insert into public.profiles values($1,null,null),($2,now(),null)",
    [user, other],
  );
  await db.query(
    "insert into public.schools values($1,true,ARRAY['example.test'])",
    [school],
  );
  await db.query("insert into public.account_trust(user_id) values($1),($2)", [
    user,
    other,
  ]);
  const claims = async (id, session) => {
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify({ sub: id, session_id: session }),
    ]);
  };
  const role = async (name) => {
    await db.exec(`set role ${name}`);
  };
  const begin = async () =>
    (await db.query("select public.begin_human_verification() as v")).rows[0].v;
  const consume = async (c, id, session, hash) =>
    db.query("select public.consume_human_verification($1,$2,$3,$4,$5)", [
      c.id,
      id,
      session,
      hash,
      "turnstile",
    ]);
  const complete = async (c, id, session) =>
    db.query("select public.complete_human_verification($1,$2,$3)", [
      c.id,
      id,
      session,
    ]);
  await role("anon");
  await assert.rejects(
    db.query("select public.begin_human_verification()"),
    /permission denied/,
  );
  await role("authenticated");
  await claims(user, sid);
  assert.equal(
    (await db.query("select public.my_trust_level() as v")).rows[0].v,
    1,
    "legacy markers do not pass CAPTCHA",
  );
  await assert.rejects(
    db.query("select public.start_school_verification($1,$2,$3,$4)", [
      "student",
      school,
      "a@example.test",
      "id_upload",
    ]),
    /complete human verification first/,
  );
  await assert.rejects(
    db.query("select public.record_id_upload($1,$2)", [
      school,
      user + "/fixture.png",
    ]),
    /complete human verification first/,
  );
  await assert.rejects(
    db.query("select public.confirm_school_email_code($1)", ["123456"]),
    /complete human verification first/,
  );
  await assert.rejects(
    db.query("select public.set_location(1,2)"),
    /complete human verification first/,
  );
  await assert.rejects(
    db.query("select * from public.nearby_users()"),
    /complete human verification first/,
  );
  await db.query("select public.stop_sharing()");
  await assert.rejects(
    db.query("select public._human_gated_set_location(1,2)"),
    /permission denied/,
  );
  await assert.rejects(
    db.query("insert into public.account_trust(user_id) values($1)", [school]),
    /permission denied/,
  );
  await assert.rejects(
    db.query("select public.complete_human_verification($1,$2,$3)", [
      school,
      user,
      sid,
    ]),
    /permission denied/,
  );
  await assert.rejects(
    db.query("insert into storage.objects values($1,$2)", [
      "id-documents",
      user + "/fixture.png",
    ]),
    /row-level security/,
  );
  await claims(other, otherSid);
  assert.equal(
    (await db.query("select public.my_trust_level() as v")).rows[0].v,
    1,
    "existing affiliation is not a CAPTCHA bypass",
  );
  await claims(user, sid);
  const expired = await begin();
  await role("none");
  await db.query(
    "update public.human_verification_challenges set expires_at=now()-interval '1 second' where id=$1",
    [expired.id],
  );
  await role("service_role");
  await assert.rejects(consume(expired, user, sid, "a".repeat(64)), /expired/);
  await role("authenticated");
  const c = await begin();
  await role("service_role");
  await assert.rejects(consume(c, other, otherSid, "a".repeat(64)), /expired/);
  await consume(c, user, sid, "a".repeat(64));
  await assert.rejects(consume(c, user, sid, "b".repeat(64)), /expired/);
  await role("authenticated");
  await claims(other, otherSid);
  const duplicate = await begin();
  await role("service_role");
  await assert.rejects(
    consume(duplicate, other, otherSid, "a".repeat(64)),
    /already consumed/,
  );
  await role("none");
  await db.query("delete from auth.sessions where id=$1", [sid]);
  await role("service_role");
  await assert.rejects(complete(c, user, sid), /session unavailable/);
  await role("none");
  await db.query("insert into auth.sessions values($1,$2)", [sid, user]);
  await role("authenticated");
  await claims(user, sid);
  const good = await begin();
  await role("service_role");
  await consume(good, user, sid, "c".repeat(64));
  // Simulate the trusted Edge Function AFTER its separately tested provider validation. Not a live CAPTCHA approval.
  await complete(good, user, sid);
  await assert.rejects(complete(good, user, sid), /no longer valid/);
  await role("authenticated");
  const saved = (
    await db.query("select public.my_verification_progress() as v")
  ).rows[0].v;
  assert.equal(saved.human_verified, true);
  assert.equal(saved.school_verified, false);
  await db.query("insert into storage.objects values($1,$2)", [
    "id-documents",
    user + "/fixture.png",
  ]);
  await assert.rejects(
    db.query("insert into storage.objects values($1,$2)", [
      "id-documents",
      other + "/fixture.png",
    ]),
    /row-level security/,
  );
  await db.query("select public.start_school_verification($1,$2,$3,$4)", [
    "student",
    school,
    "a@example.test",
    "id_upload",
  ]);
  await db.query("select public.set_location(1,2)");
  await db.query("select * from public.nearby_users()");
  await claims(other, otherSid);
  assert.equal(
    (await db.query("select public.my_verification_progress() as v")).rows[0].v
      .human_verified,
    false,
    "proof is account-bound",
  );
  for (let i = 0; i < 19; i++) await begin();
  await assert.rejects(begin(), /too many checks/);
  console.log(
    "PASS: migration reapply, no email auto-approval, legacy/badge bypass denial, RPC/storage/location gates, stop-sharing access, private helper denial, owner/session isolation, expiry, token replay, revoked session, service-only completion, persistent state and rate limit.",
  );
} finally {
  await db.close();
}
