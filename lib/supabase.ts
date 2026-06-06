import { createClient, SupabaseClient } from "@supabase/supabase-js"

let _client: SupabaseClient | undefined

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    const client = getClient()
    const value = (client as any)[prop]
    return typeof value === "function" ? value.bind(client) : value
  },
})
