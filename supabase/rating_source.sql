alter table public.feedback add column if not exists rating_source text;
alter table public.feedback add column if not exists comment_sentiment text;
delete from public.spots where slug = 'test' and name ilike 'test';
