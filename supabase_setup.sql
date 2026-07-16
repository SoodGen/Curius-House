-- Curious House — database setup (F-1 / F-3 hardened)
-- ⚠️  Run this ONLY after Phase 1 Edge Functions are live and handling all reads/writes.
--     Running it before that will take the live app offline (anon can't read kv).
-- Dashboard → SQL Editor → New query → paste → Run.

create table if not exists kv (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);

-- F-1 / F-3 fix: default-deny RLS. Anon and authenticated roles get NO access.
-- All reads + writes go through Edge Functions that use the service-role key (server-side only).
alter table kv enable row level security;

drop policy if exists "kv_open_v1" on kv;   -- kill the open policy
revoke all on table kv from anon;            -- browser gets nothing
revoke all on table kv from authenticated;
-- service_role bypasses RLS automatically — Edge Functions use it, never ship it to the client.
