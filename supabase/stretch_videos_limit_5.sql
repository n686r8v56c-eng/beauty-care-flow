-- Beauty Care Flow: increase stretching video limit from 3 to 5.
-- Safe and additive: existing video bookmarks and catalog entries are preserved.
-- Run once in Beauty Care's Supabase SQL Editor.
ALTER TABLE public.beauty_stretch_videos
  DROP CONSTRAINT IF EXISTS beauty_stretch_videos_videos_check;

ALTER TABLE public.beauty_stretch_videos
  ADD CONSTRAINT beauty_stretch_videos_videos_check
  CHECK (
    jsonb_typeof(videos) = 'array'
    AND jsonb_array_length(videos) <= 5
  );
