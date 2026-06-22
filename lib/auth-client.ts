import { supabase } from "./supabase"

export async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) return session.access_token

  // Session may have expired — try refreshing
  const { data: { session: refreshed } } = await supabase.auth.refreshSession()
  return refreshed?.access_token ?? null
}
