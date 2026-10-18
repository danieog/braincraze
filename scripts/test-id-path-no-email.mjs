// Disposable PostgreSQL/WASM fixture test for migration 006. Never connects to a deployed Supabase project.
// Pass the absolute path to an externally installed @electric-sql/pglite module.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
if (!process.argv[2])
  throw new Error("Pass the absolute PGlite module path (dist/index.js).");
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const me = "00000000-0000-0000-0000-000000000001";
try {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table public.schools(id uuid primary key default gen_random_uuid(), name text unique,
      email_domains text[] not null default '{}', active boolean not null default true);
    create table public.verification_requests(id uuid primary key default gen_random_uuid(), user_id uuid not null,
      method text not null, status text not null, role text not null, school_id uuid not null,
      school_email text not null, id_path text, created_at timestamptz not null default now());
    create table public.verification_events(id bigint generated always as identity primary key, request_id uuid not null,
      actor uuid, event text not null, detail text);
    create function public.my_trust_level() returns int language sql as $$ select 2 $$;
    insert into public.schools(name, email_domains) values ('UMD', array['umd.edu']), ('MC', '{}');
  `);
  await db.exec(
    await readFile(new URL("../supabase/migrations/006_id_path_no_school_email.sql", import.meta.url), "utf8"),
  );
  await db.exec("grant usage on schema public to authenticated; grant all on all tables in schema public to authenticated;");
  await db.exec("set role authenticated");
  await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [me]);
  const school = async (n) => (await db.query(`select id from public.schools where name=$1`, [n])).rows[0].id;
  const start = (sid, email, method) =>
    db.query(`select public.start_school_verification('student',$1,$2,$3) as id`, [sid, email, method]);

  // ID path works with no email, including at a school that has no email domains.
  for (const name of ["UMD", "MC"]) {
    const r = await start(await school(name), null, "id_upload");
    assert.ok(r.rows[0].id, name);
  }
  assert.equal((await db.query(`select school_email from public.verification_requests`)).rows[0].school_email, null);

  // A blank string counts as no email; a malformed one is still rejected.
  await start(await school("UMD"), "   ", "id_camera");
  await assert.rejects(start(await school("UMD"), "not-an-email", "id_upload"), /invalid email/);

  // The code-by-email method still has to prove the school.
  await assert.rejects(start(await school("UMD"), null, "school_email"), /school email required/);
  await assert.rejects(start(await school("UMD"), "a@gmail.com", "school_email"), /does not belong/);
  await assert.rejects(start(await school("MC"), "a@mc.edu", "school_email"), /not set up/);
  await start(await school("UMD"), "a@umd.edu", "school_email");

  console.log("PASS: ID path needs no school email (incl. schools without domains); bad email rejected; school_email method still verifies the domain.");
} finally {
  await db.close();
}
