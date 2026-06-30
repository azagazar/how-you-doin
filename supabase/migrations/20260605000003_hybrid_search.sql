-- Hybrid search combining vector similarity (pgvector) and full-text search via
-- Reciprocal Rank Fusion (RRF). Always appends the last 7 days so recent entries
-- appear even when they lack an embedding.
--
-- Parameters:
--   p_user_id       – caller's user id (pass auth.uid() from the client)
--   query_text      – plain-text search query (used for FTS; may be empty)
--   query_embedding – embedded query vector (1536-dim for text-embedding-3-small)
--   match_count     – max rows to return (default 25)
--   rrf_k           – RRF smoothing constant (default 60, rarely needs changing)

create or replace function public.hybrid_search(
  p_user_id       uuid,
  query_text      text,
  query_embedding vector,
  match_count     integer default 25,
  rrf_k           integer default 60
)
returns table (
  id               text,
  date             date,
  content          text,
  primary_energy   text,
  secondary_energy text,
  source           text,
  score            double precision
)
language plpgsql
as $function$
begin
  return query
  with
  -- Vector search: top match_count by cosine similarity
  vector_results as (
    select
      e.id as eid,
      row_number() over (order by e.embedding <=> query_embedding) as rank
    from public.journal_entries e
    where e.user_id = p_user_id
      and e.embedding is not null
    order by e.embedding <=> query_embedding
    limit match_count
  ),
  -- Full-text search on HTML-stripped content
  fts_results as (
    select
      e.id as eid,
      row_number() over (
        order by ts_rank(
          to_tsvector('simple', regexp_replace(e.content, '<[^>]+>', ' ', 'g')),
          websearch_to_tsquery('simple', query_text)
        ) desc
      ) as rank
    from public.journal_entries e
    where trim(query_text) <> ''
      and e.user_id = p_user_id
      and to_tsvector('simple', regexp_replace(e.content, '<[^>]+>', ' ', 'g'))
          @@ websearch_to_tsquery('simple', query_text)
    order by ts_rank(
      to_tsvector('simple', regexp_replace(e.content, '<[^>]+>', ' ', 'g')),
      websearch_to_tsquery('simple', query_text)
    ) desc
    limit match_count
  ),
  -- Reciprocal Rank Fusion
  rrf_results as (
    select
      coalesce(v.eid, f.eid) as eid,
      case
        when v.eid is not null and f.eid is not null then 'hybrid'
        when v.eid is not null then 'vector'
        else 'keyword'
      end as src,
      coalesce(1.0 / (rrf_k + v.rank), 0.0) +
      coalesce(1.0 / (rrf_k + f.rank), 0.0) as score
    from vector_results v
    full outer join fts_results f on v.eid = f.eid
  ),
  -- Last 7 days, excluding what RRF already found
  recent_results as (
    select
      e.id as eid,
      'recent'::text as src,
      0.0::float8 as score
    from public.journal_entries e
    where e.user_id = p_user_id
      and e.date >= current_date - interval '7 days'
      and e.id not in (select r.eid from rrf_results r)
  ),
  combined as (
    select eid, src, score from rrf_results
    union all
    select eid, src, score from recent_results
  ),
  top_results as (
    select eid, src, score
    from combined
    order by score desc
    limit match_count
  )
  select
    e.id,
    e.date,
    e.content,
    e.primary_energy,
    e.secondary_energy,
    t.src,
    t.score
  from top_results t
  join public.journal_entries e on e.id = t.eid
  order by t.score desc;
end;
$function$;
