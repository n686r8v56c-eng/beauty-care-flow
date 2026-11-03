-- Beauty Care Flow: add dental and grooming checklist categories.
-- Additive migration: existing face/hair/body items and daily records stay unchanged.
ALTER TABLE public.beauty_items
  DROP CONSTRAINT IF EXISTS beauty_items_category_check;
ALTER TABLE public.beauty_items
  ADD CONSTRAINT beauty_items_category_check
  CHECK (category IN ('face','hair','teeth','grooming'));
-- The app creates each user's default dental and grooming checklist items on first load.
-- Existing data in beauty_daily.checks is preserved as-is.
