// Disposable PostgreSQL/WASM fixture test for migration 005. Never connects to a deployed Supabase project.
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
    create table public.profiles(id uuid primary key, display_name text not null check (char_length(display_name) between 1 and 24),
      role text, school_id uuid, school_email text, school_verified_at timestamptz, badge text);
    create table public.verification_requests(id uuid primary key default gen_random_uuid(), user_id uuid not null,
      method text not null, status text not null, role text not null, school_id uuid not null, school_email text not null,
      email_verified_at timestamptz, id_path text, decided_at timestamptz, created_at timestamptz not null default now());
    create table public.verification_events(id bigint generated always as identity primary key, request_id uuid not null,
      actor uuid, event text not null, detail text);
    insert into public.schools(name, email_domains) values ('UMD', array['umd.edu','terpmail.umd.edu']), ('MC', '{}');
  `);
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/005_school_email_auto_verify.sql", import.meta.url),
      "utf8",
    ),
  );
  const q = async (sql, p) => (await db.query(sql, p)).rows;

  // 1. Unconfirmed school-email signup: nothing happens.
  await q(`insert into auth.users values ($1,'a@terpmail.umd.edu',null)`, [uid(1)]);
  assert.equal((await q(`select count(*)::int c from public.profiles`))[0].c, 0);

  // 2. Confirming it verifies the user as a student, creating the profile and an approved request.
  await q(`update auth.users set email_confirmed_at=now() where id=$1`, [uid(1)]);
  let p = (await q(`select * from public.profiles where id=$1`, [uid(1)]))[0];
  assert.equal(p.badge, "verified_student");
  assert.equal(p.role, "student");
  assert.ok(p.school_verified_at);
  assert.equal(p.school_email, "a@terpmail.umd.edu");
  let r = await q(`select method,status from public.verification_requests where user_id=$1`, [uid(1)]);
  assert.deepEqual(r, [{ method: "school_email", status: "approved" }]);
  assert.equal((await q(`select count(*)::int c from public.verification_events`))[0].c, 1);

  // 3. Mixed-case domain still matches.
  await q(`insert into auth.users values ($1,'B@UMD.EDU',now())`, [uid(2)]);
  assert.equal((await q(`select badge from public.profiles where id=$1`, [uid(2)]))[0].badge, "verified_student");

  // 4. Personal email, look-alike domains and a school with no domains are NOT verified.
  for (const [n, email] of [[3, "x@gmail.com"], [4, "x@umd.edu.evil.com"], [5, "x@notumd.edu"], [6, "x@sub.umd.edu"]]) {
    await q(`insert into auth.users values ($1,$2,now())`, [uid(n), email]);
    assert.equal((await q(`select count(*)::int c from public.profiles where id=$1`, [uid(n)]))[0].c, 0, email);
    assert.equal((await q(`select count(*)::int c from public.verification_requests where user_id=$1`, [uid(n)]))[0].c, 0, email);
  }

  // 5. An existing profile (random name already chosen) keeps its name and gains the verification.
  await q(`insert into public.profiles(id, display_name) values ($1,'Brave Possum 12')`, [uid(7)]);
  await q(`insert into auth.users values ($1,'c@umd.edu',null)`, [uid(7)]);
  await q(`update auth.users set email_confirmed_at=now() where id=$1`, [uid(7)]);
  p = (await q(`select * from public.profiles where id=$1`, [uid(7)]))[0];
  assert.equal(p.display_name, "Brave Possum 12");
  assert.equal(p.badge, "verified_student");

  // 6. An open request holding an uploaded ID image is never discarded; a human decides.
  await q(`insert into auth.users values ($1,'d@umd.edu',null)`, [uid(8)]);
  const school = (await q(`select id from public.schools where name='UMD'`))[0].id;
  await q(`insert into public.verification_requests(user_id,method,status,role,school_id,school_email,id_path)
           values ($1,'id_upload','queued','student',$2,'d@umd.edu','x/y.jpg')`, [uid(8), school]);
  await q(`update auth.users set email_confirmed_at=now() where id=$1`, [uid(8)]);
  assert.equal((await q(`select count(*)::int c from public.profiles where id=$1 and school_verified_at is not null`, [uid(8)]))[0].c, 0);
  assert.equal((await q(`select status from public.verification_requests where user_id=$1`, [uid(8)]))[0].status, "queued");

  // 7. Re-confirming an already verified user does not create a second request.
  await q(`update auth.users set email_confirmed_at=now() where id=$1`, [uid(1)]);
  assert.equal((await q(`select count(*)::int c from public.verification_requests where user_id=$1`, [uid(1)]))[0].c, 1);

  // 8. The trigger function is not callable by clients; progress reports the method.
  await db.exec("set role authenticated");
  await assert.rejects(db.query("select public.auto_verify_school_email()"), /permission denied|trigger/);
  await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [uid(1)]);
  assert.deepEqual((await q("select public.my_verification_progress() as p"))[0].p, {
    email_verified: true, school_verified: true, review_status: "approved", method: "school_email",
  });
  console.log("PASS: school-email auto-verify, look-alike rejection, existing profile kept, ID image protected, no duplicates, progress method.");
} finally {
  await db.close();
}
