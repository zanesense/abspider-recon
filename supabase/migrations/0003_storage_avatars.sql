-- 0003_storage_avatars.sql
-- Storage bucket and RLS policies for user avatar uploads

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read access for any avatar file
-- (Public avatars are often required for profile display)
drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read
  on storage.objects for select to public
  using (bucket_id = 'avatars');

-- Users can upload/update/delete only their own files in avatars bucket
-- File names must start with their auth.uid()
drop policy if exists avatars_owner_write on storage.objects;
create policy avatars_owner_write
  on storage.objects for all to authenticated
  using (
    bucket_id = 'avatars' and (storage.filename(name))::text like (auth.uid()::text || '%')
  )
  with check (
    bucket_id = 'avatars' and (storage.filename(name))::text like (auth.uid()::text || '%')
  );
