-- 0001_init_schema.sql
-- Fresh, idempotent database schema for ABSpider Recon
-- Apply with Supabase CLI or SQL editor for new DB setup

set check_function_bodies = off;

-- Required extensions
create extension if not exists "pgcrypto";     -- for gen_random_uuid
create extension if not exists "pg_trgm";      -- for GIN trigram indexing

-- -----------------------------------------------------------------------------
-- user_scans: stores every scan a user runs. Evolving JSONB fields for results/config.
-- -----------------------------------------------------------------------------
create table if not exists public.user_scans (
  scan_id           uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users (id) on delete cascade,
  target            text        not null,
  "timestamp"       bigint      not null, -- ms since epoch
  status            text        not null check (status in ('running','completed','failed','paused','stopped')),
  progress          jsonb,
  config            jsonb       not null,
  results           jsonb       not null default '{}'::jsonb,
  errors            text[]      not null default '{}',
  elapsed_ms        bigint,
  completed_at      bigint,
  security_grade    numeric(4,2),
  smart_scan_level  integer     not null default 0 check (smart_scan_level between 0 and 10),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists user_scans_user_id_idx     on public.user_scans (user_id);
create index if not exists user_scans_user_ts_idx     on public.user_scans (user_id, "timestamp" desc);
create index if not exists user_scans_status_idx      on public.user_scans (status);
create index if not exists user_scans_target_trgm_idx on public.user_scans using gin (target gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- user_preferences: one row per user for UI/scanner defaults.
-- -----------------------------------------------------------------------------
create table if not exists public.user_preferences (
  id                     uuid        primary key default gen_random_uuid(),
  user_id                uuid        not null unique references auth.users (id) on delete cascade,
  theme                  text        not null default 'system' check (theme in ('light', 'dark', 'system')),
  language               text        not null default 'en',
  auto_save              boolean     not null default true,
  scan_history_limit     integer     not null default 100 check (scan_history_limit >= 0),
  max_concurrent_scans   integer     not null default 3 check (max_concurrent_scans > 0),
  enable_notifications   boolean     not null default true,
  enable_sounds          boolean     not null default false,
  default_scan_profile   text        not null default 'balanced' check (default_scan_profile in ('quick','balanced','comprehensive','stealth')),
  export_format          text        not null default 'json' check (export_format in ('json','csv','pdf')),
  retry_attempts         integer     not null default 3 check (retry_attempts >= 0),
  user_agent             text        not null default 'ABSpider/1.0 (Security Scanner)',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- user_api_keys: per-user 3rd-party API keys as JSONB (for public/test keys only)
-- -----------------------------------------------------------------------------
create table if not exists public.user_api_keys (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  api_keys   jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- user_settings: runtime scanner configuration, one row per user.
-- -----------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  settings   jsonb       not null default jsonb_build_object(
    'discordWebhook', '',
    'proxyList',      ''
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- updated_at trigger function and triggers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_scans_updated_at       on public.user_scans;
drop trigger if exists trg_user_preferences_updated_at on public.user_preferences;
drop trigger if exists trg_user_api_keys_updated_at    on public.user_api_keys;
drop trigger if exists trg_user_settings_updated_at    on public.user_settings;

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
