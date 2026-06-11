import { createClient } from "@supabase/supabase-js"
import { hashToken } from "@/lib/api-auth"

export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}

// GET — return the masked token display (prefix only; full token is never stored)
export async function GET(req: Request) {
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
  if (!jwt) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data: { user }, error } = await admin.auth.getUser(jwt)
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await admin
    .from("user_profiles")
    .select("api_key, api_key_prefix")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 })

  const prefix = profile.api_key_prefix ?? null
  const masked = prefix ? `${prefix}${"•".repeat(40)}` : null

  return Response.json({ masked, has_key: !!profile.api_key })
}

// POST — regenerate: returns the full token ONCE, stores only the hash
export async function POST(req: Request) {
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
  if (!jwt) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data: { user }, error } = await admin.auth.getUser(jwt)
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  // Generate new key: hyd_ + 48 random hex chars
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  const newKey = "hyd_" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")

  const prefix = newKey.slice(0, 8)      // e.g. "hyd_2a60" — saved for display
  const hash   = await hashToken(newKey) // SHA-256 hex — what actually gets stored

  const { error: updateError } = await admin
    .from("user_profiles")
    .update({ api_key: hash, api_key_prefix: prefix })
    .eq("user_id", user.id)

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  // Return the plaintext token ONCE — it will never be retrievable again
  return Response.json({ api_key: newKey, prefix, masked: `${prefix}${"•".repeat(40)}` })
}
