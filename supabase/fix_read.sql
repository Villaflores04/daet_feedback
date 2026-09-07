-- Run once in Supabase SQL editor.
-- Makes every saved pulse readable by the public anon key.

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

grant usage on schema public to anon, authenticated;
grant select on table public.spots to anon, authenticated;
grant select, insert on table public.feedback to anon, authenticated;
