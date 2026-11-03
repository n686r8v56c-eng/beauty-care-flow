-- Beauty Care Flow: injection and menstrual milestone date records.
-- Additive migration. Does not modify existing diet records or Care Log data.
create table if not exists public.beauty_health_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_date date not null,
  event_type text not null check (event_type in ('mounjaro','period_start','period_end')),
  created_at timestamptz not null default now(),
  unique (user_id,record_date,event_type)
);
create index if not exists beauty_health_events_user_date_idx
  on public.beauty_health_events (user_id,record_date);
alter table public.beauty_health_events enable row level security;
drop policy if exists beauty_health_events_owner on public.beauty_health_events;
create policy beauty_health_events_owner
  on public.beauty_health_events for all to authenticated
  using ((select auth.uid())=user_id)
  with check ((select auth.uid())=user_id);
