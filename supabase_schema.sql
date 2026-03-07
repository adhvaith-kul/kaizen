-- ═══════════════════════════════════════════════════════════════
-- KAIZEN — Full Database Schema
-- Run this entire file in your Supabase SQL Editor on a fresh project.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────
create table public.users (
  id         uuid primary key default gen_random_uuid(),
  username   text not null,
  email      text unique not null,
  password   text
);

-- ─────────────────────────────────────────────────────────────
-- CATEGORIES
-- Manage categories from the Supabase Table Editor — no code changes needed.
-- sort_order controls display order in the app (lower = first).
-- habits.category references this table via FK on update cascade.
-- ─────────────────────────────────────────────────────────────
create table public.categories (
  id         serial primary key,
  label      text not null unique,
  emoji      text not null default '✨',
  sort_order int  not null default 0
);

insert into public.categories (label, emoji, sort_order) values
  ('Health',       '💪', 1),
  ('Productivity', '💼', 2),
  ('Sleep',        '😴', 3),
  ('Diet',         '🥗', 4),
  ('Finance',      '💸', 5),
  ('Upskill',      '🧠', 6),
  ('Chores',       '🧹', 7);

-- Allow anyone to read categories (no auth required for this app)
alter table public.categories enable row level security;
create policy "Public read categories" on public.categories for select using (true);

-- ─────────────────────────────────────────────────────────────
-- GROUPS
-- ─────────────────────────────────────────────────────────────
create table public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text unique not null,
  created_by uuid references public.users(id),
  settings   jsonb  -- { allowedCategories, habitsPerCategory, pointsPerCategory }
);

-- ─────────────────────────────────────────────────────────────
-- MEMBERS  (user ↔ group join table)
-- total_points is cached here per-group for fast leaderboard queries.
-- ─────────────────────────────────────────────────────────────
create table public.members (
  user_id      uuid references public.users(id),
  group_id     uuid references public.groups(id),
  total_points int default 0,
  primary key (user_id, group_id)
);

-- ─────────────────────────────────────────────────────────────
-- HABITS
-- Each habit is scoped to a specific user + group.
-- category FK → categories.label; ON UPDATE CASCADE means renaming
-- a category label in the categories table automatically updates habits.
-- ─────────────────────────────────────────────────────────────
create table public.habits (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid references public.users(id),
  group_id uuid references public.groups(id) on delete cascade,
  category text not null references public.categories(label) on update cascade on delete restrict,
  name     text not null,
  active   boolean default true
);

-- ─────────────────────────────────────────────────────────────
-- DAILY LOGS
-- One row per user per group per day.
-- completed_habit_ids: array of habit UUIDs ticked that day.
-- habit_image_urls: { habitId: publicStorageUrl } proof photos.
-- ─────────────────────────────────────────────────────────────
create table public.logs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.users(id),
  group_id            uuid references public.groups(id) on delete cascade,
  date                date not null,
  completed_habit_ids text[] not null default '{}',
  habit_image_urls    jsonb  not null default '{}'::jsonb,
  unique (user_id, group_id, date)
);

-- ─────────────────────────────────────────────────────────────
-- STORAGE — habit proof photos
-- Run these lines individually if they fail together.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('habit-images', 'habit-images', true)
  on conflict (id) do nothing;

create policy "Public Access" on storage.objects for select using ( bucket_id = 'habit-images' );
create policy "Public Insert" on storage.objects for insert with check ( bucket_id = 'habit-images' );
create policy "Public Update" on storage.objects for update using ( bucket_id = 'habit-images' );
create policy "Public Delete" on storage.objects for delete using ( bucket_id = 'habit-images' );
