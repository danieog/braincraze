-- BrainCraze: verification is optional. Apply after 001-004, 005_human_verification and 006_id_path_no_school_email.
-- NOT applied to any project by the code change that added it. This is the final word on the functions below; it
-- replaces the versions in 005_human_verification and 006.
--
-- Also turn OFF Authentication > Sign In / Providers > Email > "Confirm email" so people can join without emailing.
-- WITH THAT SETTING OFF, SUPABASE MARKS EVERY EMAIL CONFIRMED WITHOUT CHECKING IT, so email_confirmed_at proves
-- nothing and must never grant trust or a badge. That is why the school-email auto-verify trigger is dropped here.
-- What still means something: the CAPTCHA proof (human) and a person approving a school ID (school).
--
-- Trust levels (info only now; nothing is locked behind them):
--   0 = not signed in   1 = account   2 = CAPTCHA passed   3 = school ID approved by a person

-- ---------------------------------------------------------------- remove school-email auto-verify (unsafe without email proof)
drop trigger if exists on_auth_user_school_email_confirmed on auth.users;
drop function if exists public.auto_verify_school_email();

-- ---------------------------------------------------------------- trust helpers
create or replace function public.has_human_proof(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.account_trust t
    join public.human_verification_challenges c on c.id = t.challenge_id
    where t.user_id = p_user and c.user_id = p_user and c.completed_at is not null
      and c.provider = t.provider and t.provider in ('turnstile', 'hcaptcha', 'recaptcha')
  );
$$;
revoke all on function public.has_human_proof(uuid) from public, anon, authenticated;

create or replace function public.my_trust_level()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case
    when u.id is null then 0
    when p.school_verified_at is not null then 3
    when public.has_human_proof(u.id) then 2
    else 1
  end
  from (select 1) one
  left join auth.users u on u.id = auth.uid()
  left join public.profiles p on p.id = u.id;
$$;
revoke all on function public.my_trust_level() from public, anon;
grant execute on function public.my_trust_level() to authenticated;

-- Was the CAPTCHA/email gate in front of set_location, nearby_users, record_id_upload and confirm_school_email_code.
-- It now only requires a signed-in account. The name is kept so those functions keep working unchanged.
create or replace function public.require_human_verified()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
end;
$$;
revoke all on function public.require_human_verified() from public, anon;
grant execute on function public.require_human_verified() to authenticated;

-- ---------------------------------------------------------------- progress
create or replace function public.my_verification_progress()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  confirmed boolean;
  affiliation boolean;
  latest_status text;
  latest_method text;
begin
  if me is null then raise exception 'not authenticated'; end if;
  select email_confirmed_at is not null into confirmed from auth.users where id = me;
  if not found then raise exception 'account not found'; end if;
  select school_verified_at is not null into affiliation from public.profiles where id = me;
  select status, method into latest_status, latest_method from public.verification_requests
    where user_id = me order by created_at desc, id desc limit 1;
  return jsonb_build_object(
    'email_verified', confirmed,
    'human_verified', public.has_human_proof(me),
    'school_verified', coalesce(affiliation, false),
    'review_status', latest_status,
    'method', latest_method);
end;
$$;
revoke all on function public.my_verification_progress() from public, anon;
grant execute on function public.my_verification_progress() to authenticated;

-- ---------------------------------------------------------------- ID path: any signed-in account, no email needed
alter table public.verification_requests alter column school_email drop not null;

create or replace function public.start_school_verification(p_role text, p_school_id uuid, p_school_email text, p_method text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  s public.schools;
  email text := nullif(lower(trim(coalesce(p_school_email, ''))), '');
  rid uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if public.my_trust_level() >= 3 then raise exception 'already school verified'; end if;
  if p_role not in ('student', 'faculty', 'teaching_assistant', 'tutor', 'staff') then raise exception 'invalid role'; end if;
  if p_method not in ('school_email', 'id_upload', 'id_camera') then raise exception 'invalid method'; end if;

  select * into s from public.schools where id = p_school_id and active;
  if not found then raise exception 'unknown school'; end if;
  if email is not null and email !~ '^[^@\s]+@[^@\s]+$' then raise exception 'invalid email'; end if;

  -- Only the code-by-email method still has to prove the address belongs to the school.
  if p_method = 'school_email' then
    if email is null then raise exception 'school email required'; end if;
    if cardinality(s.email_domains) = 0 then
      raise exception 'email verification is not set up for this school yet';
    end if;
    if split_part(email, '@', 2) <> all (s.email_domains) then
      raise exception 'that email does not belong to the selected school';
    end if;
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
revoke all on function public.start_school_verification(text, uuid, text, text) from public, anon;
grant execute on function public.start_school_verification(text, uuid, text, text) to authenticated;

-- ---------------------------------------------------------------- storage: upload to own folder, no trust gate
do $$ begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists "id-documents: upload to own folder" on storage.objects;
    create policy "id-documents: upload to own folder" on storage.objects for insert to authenticated
      with check (bucket_id = 'id-documents' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;
