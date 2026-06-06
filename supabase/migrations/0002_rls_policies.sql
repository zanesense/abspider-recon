-- 0002_rls_policies.sql
-- Robust RLS policies for a fresh ABSpider schema

-- Enable row level security
alter table public.user_scans        enable row level security;
alter table public.user_preferences  enable row level security;
alter table public.user_api_keys     enable row level security;
alter table public.user_settings     enable row level security;

-- -------------------- user_scans --------------------
drop policy if exists user_scans_select on public.user_scans;
drop policy if exists user_scans_insert on public.user_scans;
drop policy if exists user_scans_update on public.user_scans;
drop policy if exists user_scans_delete on public.user_scans;

create policy user_scans_select
  on public.user_scans for select to authenticated
  using (user_id = auth.uid());
create policy user_scans_insert
  on public.user_scans for insert to authenticated
  with check (user_id = auth.uid());
create policy user_scans_update
  on public.user_scans for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy user_scans_delete
  on public.user_scans for delete to authenticated
  using (user_id = auth.uid());

-- -------------------- user_preferences --------------------
drop policy if exists user_preferences_select on public.user_preferences;
drop policy if exists user_preferences_insert on public.user_preferences;
drop policy if exists user_preferences_update on public.user_preferences;
drop policy if exists user_preferences_delete on public.user_preferences;

create policy user_preferences_select
  on public.user_preferences for select to authenticated
  using (user_id = auth.uid());
create policy user_preferences_insert
  on public.user_preferences for insert to authenticated
  with check (user_id = auth.uid());
create policy user_preferences_update
  on public.user_preferences for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy user_preferences_delete
  on public.user_preferences for delete to authenticated
  using (user_id = auth.uid());

-- -------------------- user_api_keys --------------------
drop policy if exists user_api_keys_select on public.user_api_keys;
drop policy if exists user_api_keys_insert on public.user_api_keys;
drop policy if exists user_api_keys_update on public.user_api_keys;
drop policy if exists user_api_keys_delete on public.user_api_keys;

create policy user_api_keys_select
  on public.user_api_keys for select to authenticated
  using (user_id = auth.uid());
create policy user_api_keys_insert
  on public.user_api_keys for insert to authenticated
  with check (user_id = auth.uid());
create policy user_api_keys_update
  on public.user_api_keys for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy user_api_keys_delete
  on public.user_api_keys for delete to authenticated
  using (user_id = auth.uid());

-- -------------------- user_settings --------------------
drop policy if exists user_settings_select on public.user_settings;
drop policy if exists user_settings_insert on public.user_settings;
drop policy if exists user_settings_update on public.user_settings;
drop policy if exists user_settings_delete on public.user_settings;

create policy user_settings_select
  on public.user_settings for select to authenticated
  using (user_id = auth.uid());
create policy user_settings_insert
  on public.user_settings for insert to authenticated
  with check (user_id = auth.uid());
create policy user_settings_update
  on public.user_settings for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy user_settings_delete
  on public.user_settings for delete to authenticated
  using (user_id = auth.uid());
