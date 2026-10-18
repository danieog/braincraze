-- Read-only progress for the authenticated owner. Apply after migrations 001–003.
-- No trust, CAPTCHA, role, badge, or approval is granted by this function.
begin;
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
begin
  if me is null then raise exception 'not authenticated'; end if;
  select email_confirmed_at is not null into confirmed from auth.users where id = me;
  if not found then raise exception 'account not found'; end if;
  select school_verified_at is not null into affiliation from public.profiles where id = me;
  select status into latest_status from public.verification_requests
    where user_id = me order by created_at desc, id desc limit 1;
  return jsonb_build_object('email_verified', confirmed,
    'school_verified', coalesce(affiliation, false), 'review_status', latest_status);
end;
$$;
revoke all on function public.my_verification_progress() from public, anon;
grant execute on function public.my_verification_progress() to authenticated;
commit;
