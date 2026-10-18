-- BrainCraze: ID image check results (written by the verify-id Edge Function, shown to admins).
-- Run once in the Supabase dashboard after 002_verification.sql.
-- The check never rejects: both "pass" and "review" go to the human review queue. Only a human decides.
-- Stored: the result, the seven true/false checks, a reason code and a timestamp. No ID number, no model text.

-- Maps a school to its entry in supabase/functions/_shared/schoolProfiles.ts. A school with no key => "review".
alter table public.schools add column if not exists profile_key text;
update public.schools set profile_key = 'umd-college-park' where name = 'University of Maryland';

alter table public.verification_requests
  add column if not exists id_check_result text check (id_check_result in ('pass', 'review')),
  add column if not exists id_check_checks jsonb,
  add column if not exists id_check_reason text,
  add column if not exists id_check_at     timestamptz;

-- Return type changes, so the function has to be dropped first.
drop function if exists public.admin_queue();
create function public.admin_queue()
returns table (request_id uuid, user_id uuid, display_name text, role text, school_name text, school_email text,
               method text, status text, email_verified boolean, id_check_result text, id_check_reason text,
               id_check_checks jsonb, id_path text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
    select r.id, r.user_id, p.display_name, r.role, s.name, r.school_email, r.method, r.status,
           r.email_verified_at is not null, r.id_check_result, r.id_check_reason, r.id_check_checks,
           r.id_path, r.created_at
    from public.verification_requests r
    join public.schools s on s.id = r.school_id
    left join public.profiles p on p.id = r.user_id
    where r.status in ('manual_review', 'queued', 'processing')
    order by r.created_at;
end;
$$;
revoke all on function public.admin_queue() from public, anon;
grant execute on function public.admin_queue() to authenticated;
