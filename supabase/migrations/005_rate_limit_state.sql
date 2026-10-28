-- M4: per-user rate-limit state, persistent across cold-starts.
--
-- RLS is enabled with no policies: server-side routes use the service role
-- (which bypasses RLS), while the anon/authenticated PostgREST surface gets
-- no access at all. The original patch left this table unprotected in the
-- public schema, which would have exposed lockout state to anyone holding
-- the anon key.

create table if not exists public.rate_limit_state (
  user_id uuid primary key,
  attempts smallint not null default 0,
  lockout_count smallint not null default 0,
  lockout_until timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists rate_limit_state_lockout_until_idx
  on public.rate_limit_state (lockout_until);

alter table public.rate_limit_state enable row level security;

-- Idempotent: CREATE TRIGGER has no IF NOT EXISTS before PG14.
drop trigger if exists rate_limit_state_set_updated_at on public.rate_limit_state;

create trigger rate_limit_state_set_updated_at
  before update on public.rate_limit_state
  for each row execute procedure public.handle_updated_at();
