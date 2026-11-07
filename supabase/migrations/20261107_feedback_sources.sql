-- Feedback sources: record where each feedback entry came from (site emoji feedback, Facebook, Google, TripAdvisor, survey, walk-in, other).
-- Run once in the Supabase SQL editor. Existing rows become 'visitor' (collected on the site).
alter table public.pulses add column if not exists source text not null default 'visitor';
alter table public.pulses drop constraint if exists pulses_source_check;
alter table public.pulses add constraint pulses_source_check
  check (source in ('visitor','facebook','google','tripadvisor','survey','walkin','other'));
