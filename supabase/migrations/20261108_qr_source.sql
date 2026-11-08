-- Adds "qr" (QR code scanned at a place) as a feedback source. Run once in the Supabase SQL editor.
alter table public.pulses drop constraint if exists pulses_source_check;
alter table public.pulses add constraint pulses_source_check
  check (source in ('visitor','facebook','google','tripadvisor','survey','walkin','qr','other'));
