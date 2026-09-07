-- Run this once in the Supabase SQL editor if reviews do not save
-- or if cover photo upload fails.

grant usage on schema public to anon, authenticated;
grant select on table public.spots to anon, authenticated;
grant select, insert on table public.feedback to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('spot-covers', 'spot-covers', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read spot covers" on storage.objects;
create policy "Public read spot covers"
  on storage.objects for select
  using (bucket_id = 'spot-covers');

drop policy if exists "Authenticated upload spot covers" on storage.objects;
create policy "Authenticated upload spot covers"
  on storage.objects for insert
  with check (bucket_id = 'spot-covers');
