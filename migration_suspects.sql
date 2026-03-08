-- ─────────────────────────────────────────────────────────────
-- SUSPECTS (Log flagging/disliking)
-- ─────────────────────────────────────────────────────────────
create table public.suspects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id),
  log_id     uuid references public.logs(id) on delete cascade,
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone,
  unique (user_id, log_id)
);

-- RLS
alter table public.suspects enable row level security;
create policy "Public read suspects" on public.suspects for select using (true);
create policy "Public insert suspects" on public.suspects for insert with check (true);
create policy "Public update suspects" on public.suspects for update using (true);

-- Index for performance
create index idx_suspects_log_id on public.suspects(log_id);
create index idx_suspects_user_id on public.suspects(user_id);
