-- BrainCraze: the ID upload path no longer needs a school email. Apply after migrations 001-005. NOT applied by the
-- code change that added it.
--
-- Before: start_school_verification demanded a school email matching the chosen school's domain for every method, and
-- failed for schools with no domains yet (Montgomery College). That blocked "personal email + school ID".
-- Now: id_upload / id_camera need no email. A human or the ID check still decides. If an email is given it is only
-- stored as supplied; it is NOT treated as proof. Only a confirmed signup email (migration 005) auto-verifies.

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
  if public.my_trust_level() < 2 then raise exception 'verify your email first'; end if;
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
