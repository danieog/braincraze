-- BrainCraze: storage for the features in the mae-iui-main UI (Tumblr-style profile, Premium upload limits,
-- Study Buddy avatar/settings, buddy notifications). Apply after 001-007.
-- NOT applied to any project by the change that added it. The app still keeps these on the device until it is
-- switched over to these tables.

-- ---------------------------------------------------------------- profile blog + buddy fields
alter table public.profiles
  add column if not exists bio                 text    not null default 'New student on BrainCraze! Exploring study groups nearby.'
                                                       check (char_length(bio) <= 200),
  add column if not exists custom_html         text    not null default '' check (char_length(custom_html) <= 10000),
  add column if not exists theme               text    not null default 'cream_minimal'
                                                       check (theme in ('cream_minimal', 'retro_tumblr', 'y2k_sparkle', 'vaporwave', 'dark_academia', 'lofi_study')),
  add column if not exists header_banner       text    check (char_length(header_banner) <= 300),
  add column if not exists animated_background text    check (char_length(animated_background) <= 300),
  add column if not exists is_premium          boolean not null default false,
  add column if not exists avatar_source       text    not null default 'buddy' check (avatar_source in ('buddy', 'selfie')),
  add column if not exists selfie_path         text,
  add column if not exists buddy_avatar        jsonb   not null default '{}'::jsonb,
  add column if not exists buddy_settings      jsonb   not null default '{}'::jsonb,
  add column if not exists stickers            jsonb   not null default '[]'::jsonb
                                                       check (jsonb_typeof(stickers) = 'array' and jsonb_array_length(stickers) <= 50);

-- Premium is paid: a user may edit their own profile row, but never their own premium flag.
create or replace function public.protect_premium_flag()
returns trigger
language plpgsql
as $$
begin
  if new.is_premium is distinct from old.is_premium and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'premium status can only be changed by the billing system';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_premium_flag on public.profiles;
create trigger protect_premium_flag before update on public.profiles
  for each row execute function public.protect_premium_flag();

-- ---------------------------------------------------------------- photos and videos with strict limits
-- Free: 10 photos, 3 videos up to 10 min. Premium: 25 photos, 10 videos up to 60 min.
create table if not exists public.profile_media (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  kind             text not null check (kind in ('photo', 'video')),
  storage_path     text not null,
  caption          text not null default '' check (char_length(caption) <= 200),
  duration_minutes int  check (duration_minutes between 1 and 60),
  created_at       timestamptz not null default now(),
  check ((kind = 'video') = (duration_minutes is not null))
);
create index if not exists profile_media_user_idx on public.profile_media (user_id, kind);
alter table public.profile_media enable row level security;

drop policy if exists "profile_media: read" on public.profile_media;
create policy "profile_media: read" on public.profile_media for select to authenticated using (true);
drop policy if exists "profile_media: insert own" on public.profile_media;
create policy "profile_media: insert own" on public.profile_media for insert to authenticated
  with check (user_id = auth.uid() and (storage_path like auth.uid()::text || '/%'));
drop policy if exists "profile_media: delete own" on public.profile_media;
create policy "profile_media: delete own" on public.profile_media for delete to authenticated using (user_id = auth.uid());

-- The count check runs in the database so a client cannot get around it. The advisory lock stops two parallel
-- inserts from both passing. duration_minutes is reported by the client; checking real video length needs a
-- server-side step that does not exist yet.
create or replace function public.enforce_media_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  premium boolean;
  existing int;
begin
  perform pg_advisory_xact_lock(hashtext('profile_media:' || new.user_id::text));
  select coalesce(p.is_premium, false) into premium from public.profiles p where p.id = new.user_id;
  select count(*) into existing from public.profile_media m where m.user_id = new.user_id and m.kind = new.kind;
  if new.kind = 'photo' and existing >= (case when premium then 25 else 10 end) then
    raise exception 'photo limit reached';
  end if;
  if new.kind = 'video' then
    if existing >= (case when premium then 10 else 3 end) then raise exception 'video limit reached'; end if;
    if new.duration_minutes > (case when premium then 60 else 10 end) then raise exception 'video is too long'; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_media_limits on public.profile_media;
create trigger enforce_media_limits before insert on public.profile_media
  for each row execute function public.enforce_media_limits();

-- ---------------------------------------------------------------- buddy notifications
create table if not exists public.buddy_notifications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  category         text not null check (category in ('missing_assignment', 'upcoming_assignment', 'past_due_assignment',
                                                     'schedule_change', 'nearby_study', 'faculty_message')),
  title            text not null check (char_length(title) <= 200),
  body             text not null check (char_length(body) <= 2000),
  urgency          text not null check (urgency in ('low', 'medium', 'high', 'critical')),
  course_or_sender text check (char_length(course_or_sender) <= 200),
  action_label     text check (char_length(action_label) <= 60),
  is_read          boolean not null default false,
  is_dismissed     boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists buddy_notifications_user_idx on public.buddy_notifications (user_id, created_at desc);
alter table public.buddy_notifications enable row level security;

drop policy if exists "buddy_notifications: read own" on public.buddy_notifications;
create policy "buddy_notifications: read own" on public.buddy_notifications for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "buddy_notifications: update own" on public.buddy_notifications;
create policy "buddy_notifications: update own" on public.buddy_notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Users may only mark their own notifications read or dismissed. Inserts come from the server (service role).
revoke insert, update, delete on public.buddy_notifications from authenticated, anon;
grant select on public.buddy_notifications to authenticated;
grant update (is_read, is_dismissed) on public.buddy_notifications to authenticated;

-- ---------------------------------------------------------------- storage: profile photos, videos and selfies
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('profile-media', 'profile-media', false)
      on conflict (id) do nothing;
  end if;
  if to_regclass('storage.objects') is not null then
    drop policy if exists "profile-media: upload to own folder" on storage.objects;
    create policy "profile-media: upload to own folder" on storage.objects for insert to authenticated
      with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
    drop policy if exists "profile-media: read" on storage.objects;
    create policy "profile-media: read" on storage.objects for select to authenticated
      using (bucket_id = 'profile-media');
    drop policy if exists "profile-media: delete own" on storage.objects;
    create policy "profile-media: delete own" on storage.objects for delete to authenticated
      using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;
