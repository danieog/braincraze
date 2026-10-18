// Disposable PostgreSQL/WASM fixture test for migration 007. Never connects to a deployed Supabase project.
// Pass the absolute path to an externally installed @electric-sql/pglite module.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
if (!process.argv[2])
  throw new Error("Pass the absolute PGlite module path (dist/index.js).");
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const uid = (n) => `00000000-0000-0000-0000-00000000000${n}`;
try {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table public.schools(id uuid primary key default gen_random_uuid(), name text unique,
      email_domains text[] not null default '{}', active boolean not null default true);
    create table public.profiles(id uuid primary key, display_name text, school_verified_at timestamptz);
    create table public.verification_requests(id uuid primary key default gen_random_uuid(), user_id uuid not null,
      method text not null, status text not null, role text not null, school_id uuid not null,
      school_email text not null, id_path text, created_at timestamptz not null default now());
    create table public.verification_events(id bigint generated always as identity primary key, request_id uuid not null,
      actor uuid, event text not null, detail text);
    create table public.human_verification_challenges(id uuid primary key default gen_random_uuid(), user_id uuid not null,
      completed_at timestamptz, provider text);
    create table public.account_trust(user_id uuid primary key, provider text, challenge_id uuid);
    insert into public.schools(name, email_domains) values ('UMD', array['umd.edu']);
    -- The old auto-verify trigger from the superseded 005 migration, to prove 007 removes it.
    create function public.auto_verify_school_email() returns trigger language plpgsql as
      $$ begin insert into public.profiles(id, display_name, school_verified_at) values (new.id,'x',now()) on conflict do nothing; return new; end $$;
    create trigger on_auth_user_school_email_confirmed after insert or update of email_confirmed_at on auth.users
      for each row execute function public.auto_verify_school_email();
  `);
  await db.exec(
    await readFile(new URL("../supabase/migrations/007_optional_verification.sql", import.meta.url), "utf8"),
  );
  await db.exec("grant usage on schema public to anon, authenticated; grant all on all tables in schema public to authenticated;");
  const q = async (sql, p) => (await db.query(sql, p)).rows;
  const as = async (n) => {
    await db.exec("set role authenticated");
    await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [n ? uid(n) : ""]);
  };
  const school = (await q(`select id from public.schools`))[0].id;

  // The old trigger is gone: a confirmed umd.edu signup is NOT auto-verified.
  await q(`insert into auth.users values ($1,'a@umd.edu',now())`, [uid(1)]);
  assert.equal((await q(`select count(*)::int c from public.profiles`))[0].c, 0);

  // An account whose email was never confirmed can still use every gate.
  await q(`insert into auth.users values ($1,'b@gmail.com',null)`, [uid(2)]);
  await as(2);
  assert.equal((await q(`select public.my_trust_level() l`))[0].l, 1);
  await db.query(`select public.require_human_verified()`);
  const rid = (await q(`select public.start_school_verification('student',$1,null,'id_upload') id`, [school]))[0].id;
  assert.ok(rid);
  let p = (await q(`select public.my_verification_progress() p`))[0].p;
  assert.deepEqual(p, {
    email_verified: false, human_verified: false, school_verified: false,
    review_status: "awaiting_upload", method: "id_upload",
  });

  // Signed-out callers are still refused.
  await as(null);
  await assert.rejects(db.query(`select public.require_human_verified()`), /not authenticated/);
  await assert.rejects(db.query(`select public.start_school_verification('student',$1,null,'id_upload')`, [school]), /not authenticated/);
  await db.exec("set role anon");
  await assert.rejects(db.query(`select public.my_trust_level()`), /permission denied/);

  // A forged trust row with no completed challenge is not human proof; a real one is.
  await db.exec("reset role");
  await q(`insert into auth.users values ($1,'c@gmail.com',now())`, [uid(3)]);
  await q(`insert into public.account_trust values ($1,'turnstile',null)`, [uid(3)]);
  await as(3);
  p = (await q(`select public.my_verification_progress() p`))[0].p;
  assert.equal(p.human_verified, false);
  assert.equal((await q(`select public.my_trust_level() l`))[0].l, 1);
  await db.exec("reset role");
  const ch = (await q(`insert into public.human_verification_challenges(user_id, completed_at, provider)
                       values ($1, now(), 'turnstile') returning id`, [uid(3)]))[0].id;
  await q(`update public.account_trust set challenge_id=$1 where user_id=$2`, [ch, uid(3)]);
  await as(3);
  assert.equal((await q(`select public.my_trust_level() l`))[0].l, 2);
  assert.equal((await q(`select public.my_verification_progress() p`))[0].p.human_verified, true);

  // School approval is level 3 even without the CAPTCHA, and blocks starting another request.
  await db.exec("reset role");
  await q(`insert into auth.users values ($1,'d@gmail.com',null)`, [uid(4)]);
  await q(`insert into public.profiles values ($1,'d',now())`, [uid(4)]);
  await as(4);
  assert.equal((await q(`select public.my_trust_level() l`))[0].l, 3);
  await assert.rejects(db.query(`select public.start_school_verification('student',$1,null,'id_upload')`, [school]), /already school verified/);

  // The proof helper is internal: clients cannot call it directly.
  await assert.rejects(db.query(`select public.has_human_proof($1)`, [uid(3)]), /permission denied/);

  // The code-by-email method still has to prove the school.
  await db.exec("reset role");
  await q(`insert into auth.users values ($1,'e@gmail.com',null)`, [uid(5)]);
  await as(5);
  await assert.rejects(db.query(`select public.start_school_verification('student',$1,'x@gmail.com','school_email')`, [school]), /does not belong/);

  console.log("PASS: gates only need sign-in; unconfirmed email works; auto-verify trigger removed; forged trust ignored; levels 1/2/3; helper private; school_email method still checked.");
} finally {
  await db.close();
}
