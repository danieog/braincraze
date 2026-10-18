// Disposable PostgreSQL/WASM fixture test. Never connects to a deployed Supabase project.
// Pass the absolute path to an externally installed @electric-sql/pglite module.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
if (!process.argv[2])
  throw new Error(
    "Pass the absolute PGlite module path; see docs/expo-signup-verification-port.md",
  );
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table public.profiles(id uuid primary key, school_verified_at timestamptz);
    create table public.verification_requests(id uuid primary key, user_id uuid, status text, created_at timestamptz);
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
  const owner = "00000000-0000-0000-0000-000000000001";
  const other = "00000000-0000-0000-0000-000000000002";
  await db.query(`insert into auth.users values($1,now()),($2,now())`, [
    owner,
    other,
  ]);
  await db.query(`insert into public.profiles values($1,null),($2,now())`, [
    owner,
    other,
  ]);
  await db.query(
    `insert into public.verification_requests values
    ('10000000-0000-0000-0000-000000000001',$1,'manual_review',now()),
    ('10000000-0000-0000-0000-000000000002',$2,'approved',now())`,
    [owner, other],
  );
  await db.exec("set role anon");
  await assert.rejects(
    db.query("select public.my_verification_progress()"),
    /permission denied/,
  );
  await db.exec("set role authenticated");
  await assert.rejects(
    db.query("select public.my_verification_progress()"),
    /not authenticated/,
  );
  await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [
    owner,
  ]);
  let result = (
    await db.query("select public.my_verification_progress() as progress")
  ).rows[0].progress;
  assert.deepEqual(result, {
    email_verified: true,
    school_verified: false,
    review_status: "manual_review",
  });
  await assert.rejects(
    db.query("select public.my_verification_progress($1)", [other]),
    /does not exist/,
  );
  await assert.rejects(
    db.query(
      `update public.profiles set school_verified_at=now() where id=$1`,
      [owner],
    ),
    /permission denied/,
  );
  await db.exec("reset role");
  await db.query(`update auth.users set email_confirmed_at=null where id=$1`, [
    owner,
  ]);
  await db.query(
    `insert into public.verification_requests values ('10000000-0000-0000-0000-000000000003',$1,'needs_reupload',now()+interval '1 second')`,
    [owner],
  );
  await db.exec("set role authenticated");
  result = (
    await db.query("select public.my_verification_progress() as progress")
  ).rows[0].progress;
  assert.deepEqual(result, {
    email_verified: false,
    school_verified: false,
    review_status: "needs_reupload",
  });
  console.log(
    "PASS: anonymous denial, missing-session denial, owner isolation, no caller-selected owner, no approval writes, latest-request selection and saved email state.",
  );
} finally {
  await db.close();
}
