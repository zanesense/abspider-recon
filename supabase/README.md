# Supabase setup

This directory contains the SQL migrations that bootstrap a fresh Supabase
project for ABSpider Recon. It is the **only** thing a first-time user has to
apply to get the app working end-to-end.

## What gets created

| Object | Purpose |
| --- | --- |
| `public.user_scans` | Persisted recon scans (config + results + progress as JSONB). |
| `public.user_preferences` | Per-user UI / scanner defaults. |
| `public.user_api_keys` | Optional 3rd-party API keys (Shodan, VirusTotal, …). |
| `public.user_settings` | Runtime settings (webhook, proxy, threads, timeout). |
| `storage` bucket `avatars` | Public avatars uploaded from Account Settings. |
| Row Level Security | Each user can only read / write their own rows. |

All tables cascade on `auth.users` deletion.

## Apply the migrations

You have two options. Pick **one**.

### Option A — Supabase CLI (recommended, reproducible)

```bash
# 1. install the CLI: https://supabase.com/docs/guides/cli
# 2. link the CLI to your project (creates supabase/.temp/*, kept out of git)
supabase link --project-ref <YOUR_PROJECT_REF>

# 3. push every migration in supabase/migrations/ to the remote database
supabase db push
```

That's it. Rerun `supabase db push` after pulling to stay in sync with the
team.

### Option B — Supabase Dashboard (no CLI)

1. Create a new project at <https://supabase.com/dashboard>.
2. Open **SQL Editor** → **New query**.
3. Paste and run each file in `supabase/migrations/` **in numeric order**:
   1. `0001_init_schema.sql`
   2. `0002_rls_policies.sql`
   3. `0003_storage_avatars.sql`
4. Copy the project **URL** and **anon key** from
   *Project Settings → API* into your local `.env` (see `.env.example`).

## Verify

After the migration, the following should succeed from the Supabase **Table
Editor**:

* `public.user_scans`, `public.user_preferences`, `public.user_api_keys`,
  `public.user_settings` exist.
* `storage.buckets` contains a row with `id = 'avatars'`.
* Each table shows the RLS badge in the dashboard.

Then run the app and sign up — a row in `user_preferences` will be created the
first time you save your settings.

## Adding a new migration

```bash
supabase migration new <short_name>
# edit supabase/migrations/<timestamp>_<short_name>.sql
supabase db push
```

Never edit a migration that has already been applied to a shared project;
create a new one instead.
