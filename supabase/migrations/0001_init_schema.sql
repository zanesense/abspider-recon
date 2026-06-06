-- 0001_init_schema.sql
-- Initial database schema for ABSpider Recon.
-- Run via Supabase CLI: `supabase db push` (with linked project)
-- Or paste into the Supabase SQL editor for a first-time setup.

set check_function_bodies = off;

-- Required extension for gen_random_uuid().
create extension if not exists "pgcrypto";

-- Enables the trigram GIN operator used by the target search index below.
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- user_scans
-- Stores the full record of every recon scan a user runs. `config`, `results`
-- and `progress` are stored as JSONB so the schema can evolve with the client
-- without further migrations.
-- ---------------------------------------------------------------------------
create table if not exists public.user_scans (
  scan_id          uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users (id) on delete cascade,
  target           text        not null,
  "timestamp"      bigint      not null,                 -- ms since epoch (client clock)
  status           text        not null
                    check (status in ('running', 'completed', 'failed', 'paused', 'stopped')),
  progress         jsonb,
  config           jsonb       not null,
  results          jsonb       not null default '{}'::jsonb,
  errors           text[]      not null default '{}',
  elapsed_ms       bigint,
  completed_at     bigint,
  security_grade   numeric(4, 2),
  smart_scan_level integer     not null default 0
                    check (smart_scan_level between 0 and 10),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists user_scans_user_id_idx       on public.user_scans (user_id);
create index if not exists user_scans_user_ts_idx       on public.user_scans (user_id, "timestamp" desc);
create index if not exists user_scans_status_idx        on public.user_scans (status);
create index if not exists user_scans_target_trgm_idx   on public.user_scans using gin (target gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- user_preferences
-- One row per user. All UI / scanner defaults live here. `upsert` is called
-- with onConflict: 'user_id'.
-- ---------------------------------------------------------------------------
create table if not exists public.user_preferences (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null unique references auth.users (id) on delete cascade,
  theme                 text        not null default 'system'
                          check (theme in ('light', 'dark', 'system')),
  language              text        not null default 'en',
  auto_save             boolean     not null default true,
  scan_history_limit    integer     not null default 100
                          check (scan_history_limit >= 0),
  max_concurrent_scans  integer     not null default 3
                          check (max_concurrent_scans > 0),
  enable_notifications  boolean     not null default true,
  enable_sounds         boolean     not null default false,
  default_scan_profile  text        not null default 'balanced'
                          check (default_scan_profile in ('quick', 'balanced', 'comprehensive', 'stealth')),
  export_format         text        not null default 'json'
                          check (export_format in ('json', 'csv', 'pdf')),
  retry_attempts        integer     not null default 3
                          check (retry_attempts >= 0),
  user_agent            text        not null default 'ABSpider/1.0 (Security Scanner)',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- user_api_keys
-- Optional third-party API keys (Shodan, VirusTotal, etc.). Stored as JSONB
-- keyed by provider name. The anon key only protects public rows, so these
-- should only ever hold public-tier / testing keys.
-- ---------------------------------------------------------------------------
create table if not exists public.user_api_keys (
  user_id   uuid        primary key references auth.users (id) on delete cascade,
  api_keys  jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- user_settings
-- Scanner runtime settings (webhook, proxy list, threads, timeout). One row
-- per user, upserted on `user_id`.
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  settings   jsonb       not null default jsonb_build_object(
    'discordWebhook', '',
    'proxyList',      '',
    'defaultThreads', 20,
    'timeout',        30
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_scans_updated_at        on public.user_scans;
drop trigger if exists trg_user_preferences_updated_at  on public.user_preferences;
drop trigger if exists trg_user_api_keys_updated_at     on public.user_api_keys;
drop trigger if exists trg_user_settings_updated_at     on public.user_settings;

create trigger trg_user_scans_updated_at
  before update on public.user_scans
  for each row execute function public.set_updated_at();

create trigger trg_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

create trigger trg_user_api_keys_updated_at
  before update on public.user_api_keys
  for each row execute function public.set_updated_at();

create trigger trg_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();
