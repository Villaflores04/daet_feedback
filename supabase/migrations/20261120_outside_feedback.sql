-- Outside feedback (scraped from Facebook etc. and imported by staff) keeps its reaction counts and
-- the collector's own text sentiment in one JSON column. Run once in the Supabase SQL editor.
-- Shape: {"kind":"post"|"comment","url":"...","reactions":{"like":0,"love":0,"care":0,"haha":0,"wow":0,"sad":0,"angry":0},"text":{"label":"positive","score":2}}
alter table public.pulses add column if not exists ext jsonb;
