-- ─────────────────────────────────────────────────────────────
-- FOLLOWS
-- ─────────────────────────────────────────────────────────────
create table public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid references public.users(id) on delete cascade,
  following_id uuid references public.users(id) on delete cascade,
  created_at   timestamp with time zone default now(),
  unique (follower_id, following_id)
);

-- RLS
alter table public.follows enable row level security;
create policy "Public read follows" on public.follows for select using (true);
create policy "Public insert follows" on public.follows for insert with check (true);
create policy "Public delete follows" on public.follows for delete using (true);

-- Index for performance
create index idx_follows_follower_id on public.follows(follower_id);
create index idx_follows_following_id on public.follows(following_id);
