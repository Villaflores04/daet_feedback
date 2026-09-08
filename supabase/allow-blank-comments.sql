-- Run once in Supabase SQL Editor.
-- DAET Pulse: comments are optional; emoji is the required official signal.

alter table public.feedback
  drop constraint if exists feedback_comment_check;

alter table public.feedback
  add constraint feedback_comment_check
  check (char_length(comment) between 0 and 600);

drop policy if exists "feedback insert public" on public.feedback;

create policy "feedback insert public" on public.feedback
  for insert with check (
    char_length(display_name) between 2 and 40
    and rating between 1 and 5
    and char_length(comment) between 0 and 600
  );
