-- Run once in the Supabase SQL editor (steps 2-4).

insert into storage.buckets (id, name, public)
values ('spot-covers', 'spot-covers', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read spot covers" on storage.objects;
create policy "Public read spot covers"
  on storage.objects for select
  using (bucket_id = 'spot-covers');

alter table public.feedback
  add column if not exists comment_sentiment text;

update public.feedback
set comment_sentiment = coalesce(comment_sentiment, sentiment)
where comment_sentiment is null;

create table if not exists public.admin_events (
  id uuid primary key default gen_random_uuid(),
  actor text not null default 'tourism-desk',
  action text not null,
  target_type text,
  target_id text,
  detail text,
  created_at timestamptz not null default now()
);

alter table public.admin_events enable row level security;

delete from public.spots where slug = 'test' and name ilike 'test';
