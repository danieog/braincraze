-- Real provider-verified human checks. Apply after 001–004; deploy the Edge Function and configure production keys first.
-- Old email-trigger markers are retained as legacy data, but NEVER count as CAPTCHA proof.
begin;
drop trigger if exists on_auth_user_email_confirmed on auth.users;
do $$ begin
  if to_regprocedure('public.mark_human_verified()') is not null then
    revoke all on function public.mark_human_verified() from public, anon, authenticated;
  end if;
end $$;

create table if not exists public.human_verification_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  nonce uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '5 minutes',
  consumed_at timestamptz,
  completed_at timestamptz,
  provider text check (provider in ('turnstile','hcaptcha','recaptcha'))
);
create index if not exists human_challenges_user_created on public.human_verification_challenges(user_id, created_at);
create table if not exists public.human_verification_tokens (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);
alter table public.human_verification_challenges enable row level security;
alter table public.human_verification_tokens enable row level security;
revoke all on public.human_verification_challenges, public.human_verification_tokens from anon, authenticated;
revoke all on public.account_trust from anon, authenticated;
alter table public.account_trust add column if not exists provider text check (provider in ('turnstile','hcaptcha','recaptcha'));
alter table public.account_trust add column if not exists challenge_id uuid references public.human_verification_challenges(id);

create or replace function public.my_trust_level()
returns int language sql stable security definer set search_path = public as $$
  select case
    when u.id is null or u.email_confirmed_at is null then 0
    when not exists (
      select 1 from public.account_trust t join public.human_verification_challenges c on c.id=t.challenge_id
      where t.user_id=u.id and c.user_id=u.id and c.completed_at is not null
        and c.provider=t.provider and t.provider in ('turnstile','hcaptcha','recaptcha')
    ) then 1
    when p.school_verified_at is not null then 3
    else 2 end
  from (select 1) one
  left join auth.users u on u.id=auth.uid()
  left join public.profiles p on p.id=u.id;
$$;

create or replace function public.require_human_verified()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if public.my_trust_level()=0 then raise exception 'confirm your email first'; end if;
  if public.my_trust_level()<2 then raise exception 'complete human verification first'; end if;
end;
$$;

create or replace function public.begin_human_verification()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  sid uuid := nullif(auth.jwt()->>'session_id','')::uuid;
  challenge public.human_verification_challenges;
begin
  if me is null or not exists(select 1 from auth.users where id=me and email_confirmed_at is not null) then
    raise exception 'confirm your email first'; end if;
  if sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=me) then raise exception 'session no longer active'; end if;
  perform pg_advisory_xact_lock(hashtextextended('human:' || me::text,0));
  if (select count(*) from public.human_verification_challenges where user_id=me and created_at>now()-interval '10 minutes')>=20 then
    raise exception 'too many checks; try later'; end if;
  update public.human_verification_challenges set consumed_at=now()
    where user_id=me and session_id=sid and consumed_at is null;
  insert into public.human_verification_challenges(user_id,session_id) values(me,sid) returning * into challenge;
  return jsonb_build_object('id',challenge.id,'nonce',challenge.nonce);
end;
$$;

create or replace function public.consume_human_verification(p_id uuid,p_user uuid,p_session uuid,p_token_hash text,p_provider text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare challenge public.human_verification_challenges;
begin
  if p_provider not in ('turnstile','hcaptcha','recaptcha') or p_provider is null then raise exception 'invalid provider'; end if;
  if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) or
     not exists(select 1 from auth.sessions where id=p_session and user_id=p_user) then raise exception 'session unavailable'; end if;
  update public.human_verification_challenges set consumed_at=now(),provider=p_provider
    where id=p_id and user_id=p_user and session_id=p_session and consumed_at is null and expires_at>now()
    returning * into challenge;
  if not found then raise exception 'check expired or consumed'; end if;
  insert into public.human_verification_tokens(token_hash) values(p_token_hash) on conflict do nothing;
  if not found then raise exception 'token already consumed'; end if;
  return jsonb_build_object('nonce',challenge.nonce);
end;
$$;

create or replace function public.complete_human_verification(p_id uuid,p_user uuid,p_session uuid)
returns void language plpgsql security definer set search_path = public as $$
declare challenge public.human_verification_challenges;
begin
  if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) or
     not exists(select 1 from auth.sessions where id=p_session and user_id=p_user) then raise exception 'session unavailable'; end if;
  update public.human_verification_challenges set completed_at=now()
    where id=p_id and user_id=p_user and session_id=p_session and consumed_at>now()-interval '2 minutes'
      and completed_at is null and expires_at>now() and provider in ('turnstile','hcaptcha','recaptcha')
    returning * into challenge;
  if not found then raise exception 'verification no longer valid'; end if;
  insert into public.account_trust(user_id,human_verified_at,provider,challenge_id)
    values(p_user,now(),challenge.provider,p_id)
    on conflict(user_id) do update set human_verified_at=excluded.human_verified_at,provider=excluded.provider,challenge_id=excluded.challenge_id;
end;
$$;

create or replace function public.my_verification_progress()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); confirmed boolean; affiliation boolean; latest_status text;
begin
  if me is null then raise exception 'not authenticated'; end if;
  select email_confirmed_at is not null into confirmed from auth.users where id=me;
  if not found then raise exception 'account not found'; end if;
  select school_verified_at is not null into affiliation from public.profiles where id=me;
  select status into latest_status from public.verification_requests where user_id=me order by created_at desc,id desc limit 1;
  return jsonb_build_object('email_verified',confirmed,'human_verified',public.my_trust_level()>=2,
    'school_verified',coalesce(affiliation,false),'review_status',latest_status);
end;
$$;

-- Guard the storage operation as well as its RPCs, including unfinished requests created before this migration.
drop policy if exists "id-documents: upload to own folder" on storage.objects;
create policy "id-documents: upload to own folder" on storage.objects for insert to authenticated
  with check(bucket_id='id-documents' and (storage.foldername(name))[1]=auth.uid()::text and public.my_trust_level()>=2);

revoke all on function public.require_human_verified(), public.begin_human_verification() from public,anon;
grant execute on function public.require_human_verified(), public.begin_human_verification() to authenticated;
revoke all on function public.consume_human_verification(uuid,uuid,uuid,text,text), public.complete_human_verification(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.consume_human_verification(uuid,uuid,uuid,text,text), public.complete_human_verification(uuid,uuid,uuid) to service_role;

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
  perform public.require_human_verified();
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

create or replace function public.record_id_upload(p_request uuid, p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  perform public.require_human_verified();
  if p_path not like me::text || '/%' then raise exception 'invalid path'; end if;
  update public.verification_requests
     set id_path = p_path, status = 'queued'
   where id = p_request and user_id = me and method in ('id_upload', 'id_camera')
     and status in ('awaiting_upload', 'needs_reupload');
  if not found then raise exception 'request not found or not accepting an upload'; end if;
  insert into public.verification_events (request_id, actor, event) values (p_request, me, 'id_uploaded');
end;
$$;

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
  perform public.require_human_verified();
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

-- Keep the original PostGIS implementations private; expose gated wrappers under the existing API names.
do $$ begin
  if to_regprocedure('public._human_gated_set_location(double precision,double precision)') is null then
    alter function public.set_location(double precision,double precision) rename to _human_gated_set_location;
  end if;
  if to_regprocedure('public._human_gated_nearby_users(integer)') is null then
    alter function public.nearby_users(integer) rename to _human_gated_nearby_users;
  end if;
end $$;
revoke all on function public._human_gated_set_location(double precision,double precision),public._human_gated_nearby_users(integer) from public,anon,authenticated;
create or replace function public.set_location(p_lat double precision,p_lng double precision)
returns void language plpgsql security definer set search_path=public as $$
begin perform public.require_human_verified(); perform public._human_gated_set_location(p_lat,p_lng); end;
$$;
create or replace function public.nearby_users(radius_m integer default 40234)
returns table(display_name text,distance_bucket text) language plpgsql stable security definer set search_path=public as $$
begin perform public.require_human_verified(); return query select * from public._human_gated_nearby_users(radius_m); end;
$$;
revoke all on function public.set_location(double precision,double precision),public.nearby_users(integer) from public,anon;
grant execute on function public.set_location(double precision,double precision),public.nearby_users(integer) to authenticated;
-- stop_sharing() remains available to authenticated users even while verification is locked.

revoke all on function public.my_trust_level(), public.my_verification_progress() from public, anon;
grant execute on function public.my_trust_level(), public.my_verification_progress() to authenticated;
commit;
