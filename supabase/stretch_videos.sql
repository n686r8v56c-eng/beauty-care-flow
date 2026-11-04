-- Beauty Care Flow: optional cloud sync for stretching-video links.
-- Safe, additive migration. Does not touch or delete existing diet or care data.
create table if not exists public.beauty_stretch_videos (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id integer not null check (exercise_id > 0),
  videos jsonb not null default '[]'::jsonb
    check (jsonb_typeof(videos) = 'array' and jsonb_array_length(videos) <= 5),
  updated_at timestamptz not null default now(),
  primary key(user_id, exercise_id)
);
alter table public.beauty_stretch_videos enable row level security;
drop policy if exists "Users view own stretch videos" on public.beauty_stretch_videos;
create policy "Users view own stretch videos" on public.beauty_stretch_videos
for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users insert own stretch videos" on public.beauty_stretch_videos;
create policy "Users insert own stretch videos" on public.beauty_stretch_videos
for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update own stretch videos" on public.beauty_stretch_videos;
create policy "Users update own stretch videos" on public.beauty_stretch_videos
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
