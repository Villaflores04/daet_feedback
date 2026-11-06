-- Categories: replace "Island" with "Market" and add "Resort".
-- Run once in the Supabase SQL editor. Existing "Island" places (Mercedes Island Views) become "Coast".
alter table public.channels drop constraint if exists channels_category_check;
alter table public.wishes   drop constraint if exists wishes_category_check;

update public.channels set category = 'Coast' where category = 'Island';
update public.wishes   set category = 'Coast' where category = 'Island';

alter table public.channels add constraint channels_category_check
  check (category in ('Coast','Heritage','Market','Resort','Civic','Park'));
alter table public.wishes add constraint wishes_category_check
  check (category in ('Coast','Heritage','Market','Resort','Civic','Park'));
