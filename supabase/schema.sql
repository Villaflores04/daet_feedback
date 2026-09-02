-- Run once in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null default 'Coast',
  barangay text,
  description text not null,
  cover_url text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  rating smallint not null check (rating between 1 and 5),
  emoji text not null check (emoji in ('😞','😐','🙂','🤩')),
  sentiment text not null check (sentiment in ('negative','mixed','positive')),
  comment text not null check (char_length(comment) between 8 and 600),
  created_at timestamptz not null default now()
);

create index if not exists feedback_spot_idx on public.feedback (spot_id, created_at desc);
create index if not exists feedback_created_idx on public.feedback (created_at desc);

alter table public.spots enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "spots readable" on public.spots;
create policy "spots readable" on public.spots for select using (true);

drop policy if exists "feedback readable" on public.feedback;
create policy "feedback readable" on public.feedback for select using (true);

drop policy if exists "feedback insert public" on public.feedback;
create policy "feedback insert public" on public.feedback
  for insert with check (
    char_length(display_name) between 2 and 40
    and rating between 1 and 5
    and char_length(comment) between 8 and 600
  );

insert into public.spots (name, slug, category, barangay, description, cover_url, featured) values
('Bagasbas Beach','bagasbas-beach','Coast','Bagasbas','Long dark-sand surfing beach on the Pacific side of Daet. Dawn glass-off, kite days, and the town''s most photographed horizon.','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80', true),
('First Rizal Monument','first-rizal-monument','Heritage','Centro','The earliest known monument to Jose Rizal in the Philippines, raised in Daet in 1898.','https://images.unsplash.com/photo-1558980664-1db506751c6c?auto=format&fit=crop&w=1600&q=80', true),
('Cathedral of St. John the Baptist','daet-cathedral','Heritage','Centro','Daet mother church. Evening mass light and the civic pulse of the old town.','https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1600&q=80', true),
('Camarines Norte Provincial Capitol','provincial-capitol','Civic','Centro','The formal seat of the province. Grounds and a working picture of CN governance.','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80', false),
('Friendship Park','friendship-park','Park','Lag-on','Town green for families, golden-hour walks, and weekend vendors.','https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80', false),
('Mercedes Island Views','mercedes-islands','Island','Nearby Mercedes','Jump-off from Daet toward Apuao and Canimog. Sandbars and outrigger crossings.','https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1600&q=80', true)
on conflict (slug) do nothing;
