-- Migration to support Option A: Group-Isolated Habits & Logs
-- Run this in your Supabase SQL Editor.

-- Step 1. Add `total_points` tracking directly to the members join table.
-- This caches the leaderboard value for each user per-group safely and fast!
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS total_points INT DEFAULT 0;

-- Step 2. Add `group_id` tying each Habit specifically to the group it was made for.
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- Step 3. Add `group_id` tying each Daily Log specifically to the group it belongs to.
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- Step 4. Drop legacy points columns from logs since points are strictly tracked in members now.
ALTER TABLE public.logs DROP COLUMN IF EXISTS total_points;
ALTER TABLE public.logs DROP COLUMN IF EXISTS group_points;

-- Note: Because we are abandoning the global log tracker for group-specific tables, your existing `habits` and `logs` without a `group_id` will be orphaned.
-- To clean up old un-attached logs & habits from the v1 MVP schema (or if you just want to start from scratch!):
DELETE FROM public.habits WHERE group_id IS NULL;

-- As you mentioned, letting go of the old format and starting fresh is the easiest way. 
-- You can wipe the logs completely with this command:
DELETE FROM public.logs;
