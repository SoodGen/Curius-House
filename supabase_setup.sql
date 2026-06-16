-- Curious House — database setup
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create table if not exists kv (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);

-- Row Level Security is on, with an open policy because this V1 has no per-user auth yet.
-- NOTE: with this policy, anyone using the app's publishable key can read/write the data.
-- That is fine for a trusted V1 cohort. When you move to real per-founder privacy,
-- replace this with Supabase Auth + scoped policies (ask Claude to do the auth upgrade).
alter table kv enable row level security;

drop policy if exists "kv_open_v1" on kv;
create policy "kv_open_v1"
  on kv for all
  to anon, authenticated
  using (true)
  with check (true);

grant all on table kv to anon, authenticated;
