import { createClient } from "@supabase/supabase-js"

export type AuthedUser = {
  user_id: string
  lang: "en" | "pl"
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}

/**
 * Validates the Bearer API key from the Authorization header.
 * Returns the user's id and language preference, or null if invalid.
 */
export async function getUserFromApiKey(req: Request): Promise<AuthedUser | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
  if (!token) return null

  const { data } = await getAdminClient()
    .from("user_profiles")
    .select("user_id, lang")
    .eq("api_key", token)
    .maybeSingle()

  if (!data) return null
  return { user_id: data.user_id, lang: data.lang as "en" | "pl" }
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 })
}

export function getAdminSupabase() {
  return getAdminClient()
}
