-- Run once in the Supabase SQL editor after schema.sql.
create table if not exists public.feedback_reactions (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  visitor_key text not null,
  reaction text not null check (reaction in ('agree','disagree')),
  created_at timestamptz not null default now(),
  unique (feedback_id, visitor_key)
);

create index if not exists feedback_reactions_feedback_idx on public.feedback_reactions (feedback_id, created_at desc);

create table if not exists public.feedback_replies (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  visitor_key text not null,
  display_name text not null check (char_length(display_name) between 2 and 40),
  comment text not null check (char_length(comment) between 2 and 400),
  created_at timestamptz not null default now()
);

create index if not exists feedback_replies_feedback_idx on public.feedback_replies (feedback_id, created_at asc);

alter table public.feedback_reactions enable row level security;
alter table public.feedback_replies enable row level security;

drop policy if exists "feedback reactions readable" on public.feedback_reactions;
create policy "feedback reactions readable" on public.feedback_reactions for select using (true);
drop policy if exists "feedback replies readable" on public.feedback_replies;
create policy "feedback replies readable" on public.feedback_replies for select using (true);
-- Writes are intentionally performed by the server API with the service-role key.
drop policy if exists "feedback reactions insert public" on public.feedback_reactions;
drop policy if exists "feedback reactions update public" on public.feedback_reactions;
drop policy if exists "feedback reactions delete public" on public.feedback_reactions;
drop policy if exists "feedback replies insert public" on public.feedback_replies;
