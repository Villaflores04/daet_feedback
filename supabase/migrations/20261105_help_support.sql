-- Help & Support: contact accounts shown to visitors, and problem / improvement reports read only by the Municipal Desk.
-- Run once in the Supabase SQL editor. Safe to run again.

create table if not exists public.support_contacts (
  id text primary key,
  kind text not null check (kind in ('phone','email','messenger','facebook','other')),
  label text not null,
  value text not null,
  note text not null default '',
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.support_reports (
  id text primary key,
  kind text not null check (kind in ('bug','improve')),
  area text not null default 'Other',
  message text not null,
  page text not null default '',
  mood text check (mood in ('wow','happy','medium','sad')),
  device text not null default '',
  contact text not null default '',
  photo text,
  status text not null default 'new' check (status in ('new','progress','resolved')),
  admin_note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists support_reports_status_idx on public.support_reports (status, created_at desc);

alter table public.support_contacts enable row level security;
alter table public.support_reports enable row level security;

-- Contacts are public by design (the office chooses what to publish). Reports have NO public policy:
-- visitors submit through the server route and only the signed-in desk reads them (service role).
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='support_contacts' and policyname='support contacts readable') then
    create policy "support contacts readable" on public.support_contacts for select using (true);
  end if;
end $$;

grant select on public.support_contacts to anon, authenticated;
