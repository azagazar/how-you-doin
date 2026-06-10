import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}

// GET — return the current user's API key
export async function GET(req: Request) {
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
  if (!jwt) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data: { user }, error } = await admin.auth.getUser(jwt)
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await admin
    .from("user_profiles")
    .select("api_key")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 })

  return Response.json({ api_key: profile.api_key })
}

// POST — regenerate the API key
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

  const { error: updateError } = await admin
    .from("user_profiles")
    .update({ api_key: newKey })
    .eq("user_id", user.id)

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  return Response.json({ api_key: newKey })
}
