-- 0003_storage_avatars.sql
-- Storage bucket + RLS policies for user avatar uploads.
-- The client uploads to `<user_id>-<random>.<ext>` under `avatars/` and reads
-- the public URL back from `supabase.storage.from('avatars').getPublicUrl()`.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5 * 1024 * 1024,                    -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read of any avatar file.
drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

-- A user can upload/update/delete only files in the avatars bucket whose
-- filename starts with their auth.uid() (client convention: `<userId>-<rand>`
-- e.g. `avatars/<userId>-1717600000.png`).
drop policy if exists avatars_owner_write on storage.objects;
create policy avatars_owner_write
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.filename(name))::text like (auth.uid()::text || '%')
  )
  with check (
    bucket_id = 'avatars'
    and (storage.filename(name))::text like (auth.uid()::text || '%')
  );
