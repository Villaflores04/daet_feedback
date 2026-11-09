-- Anonymous per-device author id (a one-way hash) so a conversation can show who is the story's author and give each
-- participant a stable number. Safe to run more than once.
alter table public.pulses add column if not exists author_key text;
create index if not exists pulses_author_key_idx on public.pulses (author_key);
