-- IVFFlat index on the embedding column for fast approximate nearest-neighbour search.
-- lists=100 is a reasonable default for a few thousand rows; increase for larger datasets.
create index if not exists journal_entries_embedding_idx
  on public.journal_entries
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
