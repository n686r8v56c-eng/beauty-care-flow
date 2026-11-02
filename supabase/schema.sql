-- Additive schema: no DROP, TRUNCATE or destructive migration.
create table if not exists public.beauty_items (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 category text not null check(category in ('face','hair')),
 kind text not null check(kind in ('check','rating')),
 label text not null, position integer not null default 0,
 archived boolean not null default false, created_at timestamptz not null default now()
);
create index if not exists beauty_items_user_idx on public.beauty_items(user_id,category,kind);
create table if not exists public.beauty_daily (
 user_id uuid not null references auth.users(id) on delete cascade,
 record_date date not null,
 checks jsonb not null default '{}'::jsonb,
 ratings jsonb not null default '{}'::jsonb,
 measurements jsonb not null default '{}'::jsonb,
 note_face text not null default '', note_hair text not null default '',
 updated_at timestamptz not null default now(),
 primary key(user_id,record_date)
);
create table if not exists public.beauty_photos (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 record_date date not null, category text not null check(category in ('root','texture','waist','thigh','calf','lower_body')),
 storage_path text not null unique, created_at timestamptz not null default now()
);
create index if not exists beauty_photos_user_date_idx on public.beauty_photos(user_id,record_date);
alter table public.beauty_items enable row level security;
alter table public.beauty_daily enable row level security;
alter table public.beauty_photos enable row level security;
drop policy if exists "beauty_items_own" on public.beauty_items;
create policy "beauty_items_own" on public.beauty_items for all to authenticated using (auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "beauty_daily_own" on public.beauty_daily;
create policy "beauty_daily_own" on public.beauty_daily for all to authenticated using (auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "beauty_photos_own" on public.beauty_photos;
create policy "beauty_photos_own" on public.beauty_photos for all to authenticated using (auth.uid()=user_id) with check(auth.uid()=user_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('beauty-private','beauty-private',false,10485760,array['image/jpeg','image/png','image/webp','image/heic']) on conflict(id) do nothing;
drop policy if exists "beauty_storage_read" on storage.objects;
create policy "beauty_storage_read" on storage.objects for select to authenticated using(bucket_id='beauty-private' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "beauty_storage_insert" on storage.objects;
create policy "beauty_storage_insert" on storage.objects for insert to authenticated with check(bucket_id='beauty-private' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "beauty_storage_delete" on storage.objects;
create policy "beauty_storage_delete" on storage.objects for delete to authenticated using(bucket_id='beauty-private' and (storage.foldername(name))[1]=auth.uid()::text);

-- Migration for existing deployments (run once in SQL Editor after checking the current constraint):
-- alter table public.beauty_photos drop constraint if exists beauty_photos_category_check;
-- alter table public.beauty_photos add constraint beauty_photos_category_check
--   check(category in ('root','texture','waist','thigh','calf','lower_body'));

-- Photo-verified gym attendance; workout minutes stored in beauty_daily.measurements JSONB.
-- Apply to an existing deployment without deleting any records.
alter table public.beauty_photos drop constraint if exists beauty_photos_category_check;
alter table public.beauty_photos add constraint beauty_photos_category_check check (category in ('root','texture','waist','thigh','calf','lower_body','gym'));
