-- BrainCraze: opt-in "nearby students" location feature.
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Also turn on: Authentication > Sign In / Providers > "Allow anonymous sign-ins".

create extension if not exists postgis with schema extensions;

-- One profile per (anonymous or real) user.
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text not null check (char_length(display_name) between 1 and 24),
  share_location boolean not null default false,
  created_at     timestamptz not null default now()
);

-- Latest approximate position per user. Rounded to ~1 km before it is stored.
create table if not exists public.user_locations (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  geog       extensions.geography(point, 4326) not null,
  updated_at timestamptz not null default now()
);

create index if not exists user_locations_geog_idx
  on public.user_locations using gist (geog);

-- Row Level Security: users only touch their own rows.
alter table public.profiles       enable row level security;
alter table public.user_locations enable row level security;

drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: insert own" on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: read own"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles: insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles: update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Users may read only their own location row. All writes go through the functions below.
drop policy if exists "locations: read own" on public.user_locations;
create policy "locations: read own" on public.user_locations for select to authenticated using (user_id = auth.uid());

-- Save my position (rounded to 2 decimals, ~1 km) and mark me as sharing.
create or replace function public.set_location(p_lat double precision, p_lng double precision)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  if p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'invalid coordinates';
  end if;

  update public.profiles set share_location = true where id = me;
  if not found then raise exception 'profile missing'; end if;

  insert into public.user_locations (user_id, geog, updated_at)
  values (
    me,
    st_setsrid(st_makepoint(round(p_lng::numeric, 2)::float8, round(p_lat::numeric, 2)::float8), 4326)::geography,
    now()
  )
  on conflict (user_id) do update set geog = excluded.geog, updated_at = now();
end;
$$;

-- Stop sharing: delete my position and clear the flag.
create or replace function public.stop_sharing()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from public.user_locations where user_id = auth.uid();
  update public.profiles set share_location = false where id = auth.uid();
end;
$$;

-- Other sharing users within the radius (default and max 25 miles = 40234 m).
-- Returns only a name and a distance bucket, never coordinates.
-- Positions older than 30 minutes are ignored. Caller must have a position too.
create or replace function public.nearby_users(radius_m int default 40234)
returns table (display_name text, distance_bucket text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with me as (
    select geog from public.user_locations where user_id = auth.uid()
  ),
  found as (
    select p.display_name, st_distance(l.geog, me.geog) as d
    from me
    join public.user_locations l on l.user_id <> auth.uid()
    join public.profiles p on p.id = l.user_id
    where p.share_location
      and l.updated_at > now() - interval '30 minutes'
      and st_dwithin(l.geog, me.geog, least(greatest(coalesce(radius_m, 40234), 1000), 40234))
  )
  select found.display_name::text,
         (case when found.d < 8047  then 'under 5 mi'
               when found.d < 16093 then '5 to 10 mi'
               else '10 to 25 mi' end)::text
  from found
  order by found.d
  limit 50;
$$;

-- Only signed-in users (anonymous sign-in counts) may call these.
revoke all on function public.set_location(double precision, double precision) from public, anon;
revoke all on function public.stop_sharing() from public, anon;
revoke all on function public.nearby_users(int) from public, anon;
grant execute on function public.set_location(double precision, double precision) to authenticated;
grant execute on function public.stop_sharing() to authenticated;
grant execute on function public.nearby_users(int) to authenticated;
