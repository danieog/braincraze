-- BrainCraze: school-email signups are school-verified automatically once the email is confirmed.
-- Apply after migrations 001-004. NOT applied to any project by the code change that added it.
--
-- REQUIRES Authentication > Sign In / Providers > Email > "Confirm email" to stay ON.
-- With it off, Supabase marks every address as confirmed without checking it, and anyone could sign up as
-- someone@umd.edu and receive a verified student badge.
--
-- Rule: when auth.users.email_confirmed_at is set and the address domain exactly matches an active school's
-- email_domains entry, the user becomes a verified student of that school and no ID is needed.
-- Everyone else (personal email, or a school with no domains filled in) keeps the ID upload path.
-- Faculty, staff, TAs and tutors who sign up with a school email also get 'student' here; they can use the ID path
-- to be reviewed for a different role. Existing users who confirmed before this migration are not changed.

create or replace function public.auto_verify_school_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.schools;
  email_domain text;
  rid uuid;
begin
  if new.email_confirmed_at is null or new.email is null then return new; end if;

  email_domain := lower(split_part(new.email, '@', 2));
  select * into s from public.schools
   where active and email_domain = any (email_domains)
   limit 1;
  if not found then return new; end if;

  if exists (select 1 from public.profiles where id = new.id and school_verified_at is not null) then
    return new;
  end if;
  -- Never discard an uploaded ID image; a person decides those.
  if exists (select 1 from public.verification_requests
              where user_id = new.id and status not in ('approved', 'rejected') and id_path is not null) then
    return new;
  end if;

  delete from public.verification_requests
   where user_id = new.id and status not in ('approved', 'rejected');

  -- The app normally creates the profile later with a random display name and reuses an existing row.
  insert into public.profiles (id, display_name, role, school_id, school_email, school_verified_at, badge)
  values (new.id, 'Possum ' || (10 + floor(random() * 90))::int, 'student', s.id, lower(new.email), now(), 'verified_student')
  on conflict (id) do update
     set role = 'student',
         school_id = s.id,
         school_email = lower(new.email),
         school_verified_at = now(),
         badge = 'verified_student';

  insert into public.verification_requests
    (user_id, method, status, role, school_id, school_email, email_verified_at, decided_at)
  values (new.id, 'school_email', 'approved', 'student', s.id, lower(new.email), now(), now())
  returning id into rid;

  insert into public.verification_events (request_id, actor, event, detail)
  values (rid, null, 'approved', 'school email confirmed at signup');

  return new;
end;
$$;
revoke all on function public.auto_verify_school_email() from public, anon, authenticated;

drop trigger if exists on_auth_user_school_email_confirmed on auth.users;
create trigger on_auth_user_school_email_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.auto_verify_school_email();

-- The progress screen needs to know how a user was verified so it can skip the ID steps for school-email users.
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
  return jsonb_build_object('email_verified', confirmed,
    'school_verified', coalesce(affiliation, false), 'review_status', latest_status,
    'method', latest_method);
end;
$$;
revoke all on function public.my_verification_progress() from public, anon;
grant execute on function public.my_verification_progress() to authenticated;
