-- Per-tier progress (lifetime field experience)
create table if not exists public.tier_progress (
  user_id uuid not null,
  tier_id integer not null,
  seconds_active bigint not null default 0,
  multiplier_bonus integer not null default 0,
  fingerprint text,
  updated_at timestamptz not null default now(),
  primary key (user_id, tier_id)
);
alter table public.tier_progress enable row level security;

create policy "Users read own tier_progress" on public.tier_progress
  for select using (auth.uid() = user_id);
create policy "Users insert own tier_progress" on public.tier_progress
  for insert with check (auth.uid() = user_id);
create policy "Users update own tier_progress" on public.tier_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Outbound visit chronology
create table if not exists public.outbound_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  url text not null,
  host text,
  tier_id integer,
  sponsor_id text,
  opened_at timestamptz not null default now(),
  returned_at timestamptz,
  dwell_seconds integer
);
alter table public.outbound_visits enable row level security;

create policy "Users read own outbound_visits" on public.outbound_visits
  for select using (auth.uid() = user_id);
create policy "Users insert own outbound_visits" on public.outbound_visits
  for insert with check (auth.uid() = user_id);
create policy "Users update own outbound_visits" on public.outbound_visits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists outbound_visits_user_opened_idx
  on public.outbound_visits (user_id, opened_at desc);

-- Per-sponsor 1-time star rating
create table if not exists public.sponsor_ratings (
  user_id uuid not null,
  sponsor_id text not null,
  stars integer not null check (stars between 1 and 5),
  rated_at timestamptz not null default now(),
  primary key (user_id, sponsor_id)
);
alter table public.sponsor_ratings enable row level security;

create policy "Users read own sponsor_ratings" on public.sponsor_ratings
  for select using (auth.uid() = user_id);
create policy "Users insert own sponsor_ratings" on public.sponsor_ratings
  for insert with check (auth.uid() = user_id);