-- Public visitors must be able to READ feedback. Run in SQL editor.

alter table public.feedback enable row level security;
alter table public.spots enable row level security;

drop policy if exists "feedback readable" on public.feedback;
create policy "feedback readable" on public.feedback for select using (true);

drop policy if exists "spots readable" on public.spots;
create policy "spots readable" on public.spots for select using (true);

grant usage on schema public to anon, authenticated;
grant select on table public.spots to anon, authenticated;
grant select, insert on table public.feedback to anon, authenticated;
