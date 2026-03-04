-- Run this in your Supabase SQL Editor

create table public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  email text unique not null,
  password text
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  created_by uuid references public.users(id)
);

create table public.members (
  user_id uuid references public.users(id),
  group_id uuid references public.groups(id),
  primary key (user_id, group_id)
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  category text not null,
  name text not null
);

create table public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  date date not null,
  completed_habit_ids text[] not null default '{}',
  total_points integer not null default 0,
  unique (user_id, date)
);
