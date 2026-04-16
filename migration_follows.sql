-- ─────────────────────────────────────────────────────────────
-- FOLLOWS
-- Safe to re-run: uses IF NOT EXISTS throughout.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid references public.users(id) on delete cascade,
  following_id uuid references public.users(id) on delete cascade,
  created_at   timestamp with time zone default now(),
  unique (follower_id, following_id)
);

-- RLS
alter table public.follows enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'follows' and policyname = 'Public read follows'
  ) then
    create policy "Public read follows" on public.follows for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'follows' and policyname = 'Public insert follows'
  ) then
    create policy "Public insert follows" on public.follows for insert with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'follows' and policyname = 'Public delete follows'
  ) then
    create policy "Public delete follows" on public.follows for delete using (true);
  end if;
end $$;

-- Indexes for performance
create index if not exists idx_follows_follower_id on public.follows(follower_id);
create index if not exists idx_follows_following_id on public.follows(following_id);

-- Force PostgREST to reload its schema cache so the new table is visible immediately
notify pgrst, 'reload schema';
