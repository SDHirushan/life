-- Run once in Supabase SQL Editor. Photos are PRIVATE by default.
create table if not exists public.lifequest_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.lifequest_snapshots enable row level security;
revoke all on public.lifequest_snapshots from anon, authenticated;
grant select, insert, update on public.lifequest_snapshots to authenticated;

create policy "Own lifequest read" on public.lifequest_snapshots
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own lifequest create" on public.lifequest_snapshots
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own lifequest edit" on public.lifequest_snapshots
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('lifequest-photos', 'lifequest-photos', false)
on conflict (id) do nothing;

-- Each photo's first path segment MUST be its user's auth UUID.
create policy "Lifequest photos read" on storage.objects
  for select to authenticated
  using (bucket_id = 'lifequest-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Lifequest photos upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lifequest-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Lifequest photos update" on storage.objects
  for update to authenticated
  using (bucket_id = 'lifequest-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'lifequest-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Lifequest photos delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lifequest-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
