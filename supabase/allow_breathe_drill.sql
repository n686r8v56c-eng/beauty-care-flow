-- Allow the new Breathe drill (stable exercise_id 51) while preserving all existing video links.
-- Run once in the Beauty Care Supabase SQL Editor if cloud sync is enabled.
alter table public.beauty_stretch_videos
  drop constraint if exists beauty_stretch_videos_exercise_id_check;
alter table public.beauty_stretch_videos
  add constraint beauty_stretch_videos_exercise_id_check
  check (exercise_id between 1 and 51);
