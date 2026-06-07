-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User config table (hemisphere preferences + encrypted API keys)
create table public.user_config (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  left_provider text not null,
  right_provider text not null,
  left_key_encrypted text not null,
  right_key_encrypted text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sessions table (one per intake form submission)
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  q1 text not null,
  q2 text not null,
  q3 text not null,
  left_provider text not null,
  right_provider text not null
);

-- Results table (one per completed pipeline run)
create table public.results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  left_output text not null,
  final_output text not null,
  preflight_sanity boolean default true,
  preflight_balance boolean default true,
  preflight_quality boolean default true,
  retry_count smallint default 0,
  fault_origin text check (fault_origin in ('left', 'right', 'ambiguous', null)),
  rating smallint check (rating between 1 and 5),
  rated_at timestamptz
);

-- Low-rated results view for analysis
create view public.low_rated_results as
  select
    r.id,
    r.rating,
    r.final_output,
    r.left_output,
    r.fault_origin,
    r.retry_count,
    r.preflight_sanity,
    r.preflight_balance,
    r.preflight_quality,
    s.q1,
    s.q2,
    s.q3,
    s.left_provider,
    s.right_provider,
    r.created_at
  from public.results r
  join public.sessions s on s.id = r.session_id
  where r.rating <= 2
  order by r.created_at desc;

-- RLS: enable on all tables
alter table public.user_config enable row level security;
alter table public.sessions enable row level security;
alter table public.results enable row level security;

-- user_config policies
create policy "Users can read own config"
  on public.user_config for select
  using (auth.uid() = user_id);

create policy "Users can insert own config"
  on public.user_config for insert
  with check (auth.uid() = user_id);

create policy "Users can update own config"
  on public.user_config for update
  using (auth.uid() = user_id);

-- sessions policies
create policy "Users can read own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

-- results policies
create policy "Users can read own results"
  on public.results for select
  using (auth.uid() = user_id);

create policy "Users can insert own results"
  on public.results for insert
  with check (auth.uid() = user_id);

create policy "Users can update own results"
  on public.results for update
  using (auth.uid() = user_id);

-- updated_at trigger for user_config
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_user_config_updated
  before update on public.user_config
  for each row execute procedure public.handle_updated_at();
