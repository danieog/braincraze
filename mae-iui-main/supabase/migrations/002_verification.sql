-- BrainCraze: school identity + human verification (trust levels 0-3).
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Also turn on: Authentication > Attack Protection (Bot and Abuse Protection) > Enable CAPTCHA protection (Cloudflare Turnstile),
-- and Authentication > Sign In / Providers > Email > "Confirm email".
--
-- Trust levels (computed by my_trust_level(), never stored or writable by clients):
--   0 = no confirmed email
--   1 = email verified
--   2 = human verified (set by a trigger when the email is confirmed; this only means something
--       while CAPTCHA protection is enabled in the dashboard, because signup then requires a Turnstile token)
--   3 = school verified

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- schools
create table if not exists public.schools (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  email_domains text[] not null default '{}',
  active        boolean not null default true
);

-- Montgomery College's email domain(s) are intentionally empty: fill them in from an official source,
-- then the school-email option works for it. Until then only the ID path is possible.
insert into public.schools (name, email_domains) values
  ('University of Maryland', array['umd.edu', 'terpmail.umd.edu']),
  ('Montgomery College', '{}')
on conflict (name) do nothing;

alter table public.schools enable row level security;
drop policy if exists "schools: read active" on public.schools;
create policy "schools: read active" on public.schools for select to authenticated using (active);

-- ---------------------------------------------------------------- profiles
alter table public.profiles
  add column if not exists role                      text check (role in ('student', 'faculty', 'teaching_assistant', 'tutor', 'staff')),
  add column if not exists school_id                 uuid references public.schools (id),
  add column if not exists school_email              text,
  add column if not exists school_verified_at        timestamptz,
  add column if not exists badge                     text check (badge in ('verified_student', 'verified_faculty', 'verified_teaching_assistant', 'verified_staff', 'verified_tutor')),
  add column if not exists admin_status              boolean not null default false;

-- Clients may only write their own display name / sharing flag. Everything about trust is server-controlled.
-- To make someone an admin, run in the SQL editor: update public.profiles set admin_status = true where id = '<user uuid>';
revoke insert, update on public.profiles from authenticated, anon;
grant insert (id, display_name, share_location) on public.profiles to authenticated;
grant update (display_name, share_location) on public.profiles to authenticated;

-- ---------------------------------------------------------------- human verification marker
create table if not exists public.account_trust (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  human_verified_at timestamptz not null default now()
);
alter table public.account_trust enable row level security;
-- No policies: only the trigger / security definer functions below touch it.

create or replace function public.mark_human_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null then
    insert into public.account_trust (user_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.mark_human_verified();

-- Backfill users who already confirmed before this migration ran.
insert into public.account_trust (user_id)
select id from auth.users where email_confirmed_at is not null
on conflict do nothing;

-- ---------------------------------------------------------------- helpers
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select admin_status from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.my_trust_level()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case
    when u.id is null or u.email_confirmed_at is null then 0
    when p.school_verified_at is not null then 3
    when t.user_id is not null then 2
    else 1
  end
  from (select 1) one
  left join auth.users u on u.id = auth.uid()
  left join public.profiles p on p.id = u.id
  left join public.account_trust t on t.user_id = u.id;
$$;

-- ---------------------------------------------------------------- requests
create table if not exists public.verification_requests (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  method             text not null check (method in ('school_email', 'id_upload', 'id_camera')),
  status             text not null check (status in (
                       'pending_email',    -- waiting for the school-email code
                       'awaiting_upload',  -- waiting for the ID image
                       'queued',           -- ID uploaded, waiting for the model
                       'processing',
                       'manual_review',
                       'needs_reupload',
                       'approved',
                       'rejected')),
  role               text not null check (role in ('student', 'faculty', 'teaching_assistant', 'tutor', 'staff')),
  school_id          uuid not null references public.schools (id),
  school_email       text not null,
  email_verified_at  timestamptz,
  id_path            text,            -- storage path; cleared once the image is deleted
  name_match         boolean,
  school_match       boolean,
  role_match         boolean,
  id_legible         boolean,
  reviewer           uuid references auth.users (id),
  review_note        text,
  created_at         timestamptz not null default now(),
  decided_at         timestamptz
);

-- One open request per user.
create unique index if not exists verification_one_open_per_user
  on public.verification_requests (user_id)
  where status not in ('approved', 'rejected');

create table if not exists public.verification_events (
  id         bigint generated always as identity primary key,
  request_id uuid not null references public.verification_requests (id) on delete cascade,
  actor      uuid,                   -- null = system
  event      text not null,
  detail     text,
  created_at timestamptz not null default now()
);

-- Hashed one-time codes for the school email. Written/read only by the send-school-code function (service role)
-- and confirm_school_email_code().
create table if not exists public.school_email_codes (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  request_id uuid not null references public.verification_requests (id) on delete cascade,
  code_hash  bytea not null,
  expires_at timestamptz not null,
  attempts   int not null default 0
);

alter table public.verification_requests enable row level security;
alter table public.verification_events   enable row level security;
alter table public.school_email_codes    enable row level security;

drop policy if exists "requests: read own" on public.verification_requests;
create policy "requests: read own" on public.verification_requests for select to authenticated using (user_id = auth.uid());
-- No insert/update/delete policies: every write goes through the functions below.
revoke insert, update, delete on public.verification_requests from authenticated, anon;
revoke all on public.verification_events from authenticated, anon;
revoke all on public.school_email_codes  from authenticated, anon;

-- ---------------------------------------------------------------- internal: apply a final decision
create or replace function public._decide_request(p_request uuid, p_decision text, p_actor uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.verification_requests;
begin
  if p_decision not in ('approved', 'rejected') then raise exception 'invalid decision'; end if;
  select * into r from public.verification_requests where id = p_request for update;
  if not found then raise exception 'request not found'; end if;
  if r.status in ('approved', 'rejected') then raise exception 'request already decided'; end if;

  update public.verification_requests
     set status = p_decision, reviewer = p_actor, review_note = p_note, decided_at = now()
   where id = p_request;

  if p_decision = 'approved' then
    update public.profiles
       set role = r.role,
           school_id = r.school_id,
           school_email = r.school_email,
           school_verified_at = now(),
           badge = 'verified_' || r.role
     where id = r.user_id;
    if not found then raise exception 'profile missing'; end if;
  end if;

  delete from public.school_email_codes where user_id = r.user_id;
  insert into public.verification_events (request_id, actor, event, detail) values (p_request, p_actor, p_decision, p_note);
end;
$$;
revoke all on function public._decide_request(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public._decide_request(uuid, text, uuid, text) to service_role;

-- ---------------------------------------------------------------- user-facing functions
create or replace function public.start_school_verification(p_role text, p_school_id uuid, p_school_email text, p_method text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  s public.schools;
  email text := lower(trim(p_school_email));
  rid uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if public.my_trust_level() < 2 then raise exception 'verify your email first'; end if;
  if public.my_trust_level() >= 3 then raise exception 'already school verified'; end if;
  if p_role not in ('student', 'faculty', 'teaching_assistant', 'tutor', 'staff') then raise exception 'invalid role'; end if;
  if p_method not in ('school_email', 'id_upload', 'id_camera') then raise exception 'invalid method'; end if;

  select * into s from public.schools where id = p_school_id and active;
  if not found then raise exception 'unknown school'; end if;
  if email !~ '^[^@\s]+@[^@\s]+$' then raise exception 'invalid email'; end if;
  if cardinality(s.email_domains) = 0 then
    raise exception 'email verification is not set up for this school yet';
  end if;
  if split_part(email, '@', 2) <> all (s.email_domains) then
    raise exception 'that email does not belong to the selected school';
  end if;

  -- Replace an earlier unfinished attempt, but never orphan an uploaded ID image.
  if exists (select 1 from public.verification_requests
              where user_id = me and status not in ('approved', 'rejected') and id_path is not null) then
    raise exception 'you already have a request under review';
  end if;
  delete from public.verification_requests
   where user_id = me and status not in ('approved', 'rejected');

  insert into public.verification_requests (user_id, method, status, role, school_id, school_email)
  values (me, p_method,
          case when p_method = 'school_email' then 'pending_email' else 'awaiting_upload' end,
          p_role, p_school_id, email)
  returning id into rid;

  insert into public.verification_events (request_id, actor, event, detail) values (rid, me, 'started', p_method);
  return rid;
end;
$$;

-- Step 2 of the school-email path. The code itself is generated and emailed by the send-school-code Edge Function.
create or replace function public.confirm_school_email_code(p_code text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  me uuid := auth.uid();
  r public.verification_requests;
  c public.school_email_codes;
begin
  if me is null then raise exception 'not authenticated'; end if;
  select * into r from public.verification_requests
   where user_id = me and status in ('pending_email', 'awaiting_upload', 'queued', 'processing', 'manual_review', 'needs_reupload');
  if not found then raise exception 'no open verification request'; end if;
  select * into c from public.school_email_codes where user_id = me and request_id = r.id for update;
  if not found then raise exception 'no code was sent'; end if;
  if c.expires_at < now() then raise exception 'code expired'; end if;
  if c.attempts >= 5 then raise exception 'too many attempts'; end if;

  if c.code_hash <> extensions.digest(trim(p_code), 'sha256') then
    update public.school_email_codes set attempts = attempts + 1 where user_id = me;
    raise exception 'wrong code';
  end if;

  update public.verification_requests set email_verified_at = now() where id = r.id;
  insert into public.verification_events (request_id, actor, event) values (r.id, me, 'school_email_verified');

  if r.method = 'school_email' then
    perform public._decide_request(r.id, 'approved', null, 'school email code verified');
    return 'approved';
  end if;
  return r.status;   -- ID path: the proof is recorded; the ID check / admin still decides
end;
$$;

-- Attach an uploaded ID image (storage path must be inside my own folder) and queue it for checking.
create or replace function public.record_id_upload(p_request uuid, p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  if p_path not like me::text || '/%' then raise exception 'invalid path'; end if;
  update public.verification_requests
     set id_path = p_path, status = 'queued'
   where id = p_request and user_id = me and method in ('id_upload', 'id_camera')
     and status in ('awaiting_upload', 'needs_reupload');
  if not found then raise exception 'request not found or not accepting an upload'; end if;
  insert into public.verification_events (request_id, actor, event) values (p_request, me, 'id_uploaded');
end;
$$;

-- What anyone may see about a user: display name, school and badge. Never IDs or documents.
create or replace function public.get_public_profile(p_user uuid)
returns table (display_name text, school_name text, badge text, is_school_verified boolean)
language sql
stable
security definer
set search_path = public
as $$
  select p.display_name, s.name, p.badge, p.school_verified_at is not null
  from public.profiles p
  left join public.schools s on s.id = p.school_id and p.school_verified_at is not null
  where p.id = p_user;
$$;

-- ---------------------------------------------------------------- admin functions
create or replace function public.admin_queue()
returns table (request_id uuid, user_id uuid, display_name text, role text, school_name text, school_email text,
               method text, status text, email_verified boolean, name_match boolean, school_match boolean,
               role_match boolean, id_legible boolean, has_image boolean, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
    select r.id, r.user_id, p.display_name, r.role, s.name, r.school_email, r.method, r.status,
           r.email_verified_at is not null, r.name_match, r.school_match, r.role_match, r.id_legible,
           r.id_path is not null, r.created_at
    from public.verification_requests r
    join public.schools s on s.id = r.school_id
    left join public.profiles p on p.id = r.user_id
    where r.status in ('manual_review', 'queued', 'processing')
    order by r.created_at;
end;
$$;

-- Returns the image path so the admin client can delete it from storage (admins have a delete policy).
create or replace function public.admin_decide(p_request uuid, p_decision text, p_note text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  path text;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select id_path into path from public.verification_requests where id = p_request;
  perform public._decide_request(p_request, p_decision, auth.uid(), p_note);
  return path;
end;
$$;

create or replace function public.admin_request_reupload(p_request uuid, p_note text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  path text;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select id_path into path from public.verification_requests where id = p_request;
  update public.verification_requests
     set status = 'needs_reupload', review_note = p_note, reviewer = auth.uid()
   where id = p_request and status in ('manual_review', 'queued', 'processing');
  if not found then raise exception 'request not found or already decided'; end if;
  insert into public.verification_events (request_id, actor, event, detail) values (p_request, auth.uid(), 'reupload_requested', p_note);
  return path;
end;
$$;

-- Call after the image has been removed from storage so no stale path remains.
create or replace function public.clear_id_path(p_request uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update public.verification_requests set id_path = null where id = p_request;
end;
$$;

-- ---------------------------------------------------------------- storage (private bucket for ID images)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('id-documents', 'id-documents', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "id-documents: upload to own folder" on storage.objects;
drop policy if exists "id-documents: admin read"            on storage.objects;
drop policy if exists "id-documents: admin delete"          on storage.objects;
create policy "id-documents: upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'id-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "id-documents: admin read" on storage.objects for select to authenticated
  using (bucket_id = 'id-documents' and public.is_admin());
create policy "id-documents: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'id-documents' and public.is_admin());
-- The verify-id Edge Function uses the service role, which bypasses these policies.

-- ---------------------------------------------------------------- grants
revoke all on function public.my_trust_level()                                  from public, anon;
revoke all on function public.is_admin()                                        from public, anon;
revoke all on function public.start_school_verification(text, uuid, text, text) from public, anon;
revoke all on function public.confirm_school_email_code(text)                   from public, anon;
revoke all on function public.record_id_upload(uuid, text)                      from public, anon;
revoke all on function public.get_public_profile(uuid)                          from public, anon;
revoke all on function public.admin_queue()                                     from public, anon;
revoke all on function public.admin_decide(uuid, text, text)                    from public, anon;
revoke all on function public.admin_request_reupload(uuid, text)                from public, anon;
revoke all on function public.clear_id_path(uuid)                               from public, anon;
grant execute on function public.my_trust_level()                                  to authenticated;
grant execute on function public.is_admin()                                        to authenticated;
grant execute on function public.start_school_verification(text, uuid, text, text) to authenticated;
grant execute on function public.confirm_school_email_code(text)                   to authenticated;
grant execute on function public.record_id_upload(uuid, text)                      to authenticated;
grant execute on function public.get_public_profile(uuid)                          to authenticated;
grant execute on function public.admin_queue()                                     to authenticated;
grant execute on function public.admin_decide(uuid, text, text)                    to authenticated;
grant execute on function public.admin_request_reupload(uuid, text)                to authenticated;
grant execute on function public.clear_id_path(uuid)                               to authenticated;
