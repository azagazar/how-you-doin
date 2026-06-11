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

/** SHA-256 hex digest of a string — works in both Edge and Node runtimes */
export async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Validates the Bearer API key from the Authorization header.
 * Compares the SHA-256 hash of the incoming token against the stored hash.
 * Returns the user's id and language preference, or null if invalid.
 */
export async function getUserFromApiKey(req: Request): Promise<AuthedUser | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
  if (!token) return null

  const hash = await hashToken(token)

  const { data } = await getAdminClient()
    .from("user_profiles")
    .select("user_id, lang")
    .eq("api_key", hash)
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
