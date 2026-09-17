-- DAET Pulse shared feedback migration
-- Run once in the Supabase SQL Editor. It keeps existing rows and seeds only missing places.

create extension if not exists "pgcrypto";

create table if not exists public.channels (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null check (category in ('Coast','Heritage','Island','Civic','Park')),
  featured boolean not null default false,
  cover text not null default '',
  blurb text not null default '',
  about text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.pulses (
  id text primary key,
  channel_id text not null references public.channels(id) on delete cascade,
  parent_id text references public.pulses(id) on delete cascade,
  callsign text not null,
  face text not null check (face in ('wow','happy','medium','sad')),
  body text not null default '',
  photo text,
  reacts_up integer not null default 0,
  reacts_down integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.wishes (
  id text primary key,
  name text not null,
  where_in_daet text not null default '',
  why text not null default '',
  category text not null check (category in ('Coast','Heritage','Island','Civic','Park')),
  callsign text not null,
  photo text,
  status text not null default 'open' check (status in ('open','kept','burned')),
  channel_id text references public.channels(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists pulses_channel_idx on public.pulses (channel_id, created_at desc);
create index if not exists pulses_parent_idx on public.pulses (parent_id);

alter table public.channels enable row level security;
alter table public.pulses enable row level security;
alter table public.wishes enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='channels' and policyname='channels readable') then
    create policy "channels readable" on public.channels for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pulses' and policyname='pulses readable') then
    create policy "pulses readable" on public.pulses for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wishes' and policyname='wishes readable') then
    create policy "wishes readable" on public.wishes for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pulses' and policyname='pulses insert public') then
    create policy "pulses insert public" on public.pulses for insert with check (face in ('wow','happy','medium','sad'));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wishes' and policyname='wishes insert public') then
    create policy "wishes insert public" on public.wishes for insert with check (char_length(name) >= 3);
  end if;
end $$;

grant select on public.channels, public.pulses, public.wishes to anon, authenticated;
grant insert on public.pulses, public.wishes to anon, authenticated;

insert into public.channels (id, slug, name, category, featured, cover, blurb, about) values
('ch-bagasbas','bagasbas-beach','Bagasbas Beach','Coast',true,'/spots/bagasbas-surf.jpg','Long dark-sand surfing beach on the Pacific side of Daet. Dawn glass-off and the town''s most photographed horizon.','Bagasbas faces due east, so first light hits the water before it hits town.'),
('ch-cathedral','cathedral-st-john','Cathedral of St. John the Baptist','Heritage',true,'/spots/st-john.jpg','Daet mother church. Franciscan stone, evening mass light, and the civic pulse of the old town plaza.','Raised by Franciscan friars in 1611, the Parroquia de San Juan Bautista is one of the oldest churches in Camarines Norte.'),
('ch-rizal','first-rizal-monument','First Rizal Monument','Heritage',false,'/spots/rizal.jpg','The earliest known monument to Jose Rizal in the Philippines, raised in Daet in 1898 — a pylon, not a standing statue.','Unveiled 30 December 1898 by Lt. Col. Antonio Sanz and Ildefonso Alegre.'),
('ch-mercedes','mercedes-island-views','Mercedes Island Views','Island',true,'/spots/mercedes.jpg','Jump-off from Daet toward Apuao and Canimog. Sandbars, outrigger crossings, and gin-clear shallows.','Daet is the jump-off; Mercedes holds the islands.'),
('ch-capitol','provincial-capitol','Camarines Norte Provincial Capitol','Civic',false,'/spots/capitol.jpg','The formal seat of the province. Grounds, flags, and a working picture of Camarines Norte governance.','Daet is the provincial capital. The capitol grounds are part of the civic walk.'),
('ch-park','friendship-park','Friendship Park','Park',false,'/spots/friendship-park.jpg','Shaded civic park in the heart of Daet — trees, path, and the afternoon crowd.','The town''s living room when the beach is too far and the plaza is too loud.')
on conflict (id) do nothing;
