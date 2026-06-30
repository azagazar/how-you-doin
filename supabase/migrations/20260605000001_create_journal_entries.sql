-- Create journal_entries table with RLS
-- Enables pgvector extension required for the embedding column (migration 20260605000002)

create extension if not exists vector;

create table if not exists public.journal_entries (
  id           text        not null primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  date         date        not null,
  primary_energy   text    null,
  secondary_energy text    null,
  content      text        not null default '',
  created_at   timestamptz not null,
  embedding    vector      null,
  photo_url    text        null,
  unique (user_id, date)
);

alter table public.journal_entries enable row level security;

-- Each user can only read, insert, update, and delete their own entries
create policy "Users see own entries"
  on public.journal_entries
  for all
  to public
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
