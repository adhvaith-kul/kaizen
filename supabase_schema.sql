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
  password   text,
  avatar_url text
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
-- HABIT COMPLETION LOGS
-- Refactored: One row per single habit completion.
-- This allows per-habit proof images, likes, and comments.
-- ─────────────────────────────────────────────────────────────
create table public.logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id),
  group_id   uuid references public.groups(id) on delete cascade,
  habit_id   uuid references public.habits(id) on delete cascade,
  date       date not null,
  image_url  text,
  created_at timestamp with time zone default now(),
  unique (user_id, group_id, habit_id, date)
);

-- ─────────────────────────────────────────────────────────────
-- LIKES
-- ─────────────────────────────────────────────────────────────
create table public.likes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id),
  log_id     uuid references public.logs(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (user_id, log_id)
);

-- ─────────────────────────────────────────────────────────────
-- COMMENTS
-- ─────────────────────────────────────────────────────────────
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id),
  log_id     uuid references public.logs(id) on delete cascade,
  text       text not null,
  created_at timestamp with time zone default now()
);

-- ─────────────────────────────────────────────────────────────
-- STORAGE — habit proof photos
-- Run these lines individually if they fail together.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('habit-images', 'habit-images', true),
         ('profile-images', 'profile-images', true)
  on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Insert" on storage.objects;
drop policy if exists "Public Update" on storage.objects;
drop policy if exists "Public Delete" on storage.objects;

create policy "Public Access" on storage.objects for select using ( bucket_id in ('habit-images', 'profile-images') );
create policy "Public Insert" on storage.objects for insert with check ( bucket_id in ('habit-images', 'profile-images') );
create policy "Public Update" on storage.objects for update using ( bucket_id in ('habit-images', 'profile-images') );
create policy "Public Delete" on storage.objects for delete using ( bucket_id in ('habit-images', 'profile-images') );
