-- 0004_secure_api_keys.sql
-- Remove direct client access to user_api_keys; only service_role via backend proxy.

alter table public.user_api_keys enable row level security;

drop policy if exists user_api_keys_select on public.user_api_keys;
drop policy if exists user_api_keys_insert on public.user_api_keys;
drop policy if exists user_api_keys_update on public.user_api_keys;
drop policy if exists user_api_keys_delete on public.user_api_keys;

-- Only service_role (backend) can manage keys — no direct browser access.
create policy user_api_keys_service_select
  on public.user_api_keys for select
  to service_role
  using (true);
create policy user_api_keys_service_insert
  on public.user_api_keys for insert
  to service_role
  with check (true);
create policy user_api_keys_service_update
  on public.user_api_keys for update
  to service_role
  using (true)
  with check (true);
create policy user_api_keys_service_delete
  on public.user_api_keys for delete
  to service_role
  using (true);
