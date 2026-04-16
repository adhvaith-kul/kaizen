-- ─────────────────────────────────────────────────────────────
-- SUSPECTS (Log flagging/disliking)
-- Safe to re-run: uses IF NOT EXISTS throughout.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.suspects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id),
  log_id     uuid references public.logs(id) on delete cascade,
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone,
  unique (user_id, log_id)
);

-- RLS
alter table public.suspects enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'suspects' and policyname = 'Public read suspects'
  ) then
    create policy "Public read suspects" on public.suspects for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'suspects' and policyname = 'Public insert suspects'
  ) then
    create policy "Public insert suspects" on public.suspects for insert with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'suspects' and policyname = 'Public update suspects'
  ) then
    create policy "Public update suspects" on public.suspects for update using (true);
  end if;
end $$;

-- Indexes for performance
create index if not exists idx_suspects_log_id on public.suspects(log_id);
create index if not exists idx_suspects_user_id on public.suspects(user_id);

-- Force PostgREST to reload its schema cache so the new table is visible immediately
notify pgrst, 'reload schema';
