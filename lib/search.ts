import { SupabaseClient } from "@supabase/supabase-js"

export type SearchResult = {
  id: string
  date: string
  content: string
  primary_energy: string | null
  secondary_energy: string | null
  source: "vector" | "keyword" | "hybrid" | "recent"
  score: number
}

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  })
  if (!res.ok) throw new Error(`OpenAI embeddings API ${res.status}`)
  const data = (await res.json()) as { data: { embedding: number[] }[] }
  return data.data[0].embedding
}

export async function hybridSearch(
  supabase: SupabaseClient,
  userId: string,
  message: string,
  matchCount = 25
): Promise<SearchResult[]> {
  const embedding = await generateEmbedding(message)

  const { data, error } = await supabase.rpc("hybrid_search", {
    p_user_id: userId,
    query_text: message,
    query_embedding: embedding,
    match_count: matchCount,
  })

  if (error) throw new Error(`hybrid_search RPC: ${error.message}`)
  return (data ?? []) as SearchResult[]
}
