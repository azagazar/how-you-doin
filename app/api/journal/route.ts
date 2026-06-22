import { createClient } from "@supabase/supabase-js"
import { EnergyKey } from "@/lib/types"

export const runtime = "nodejs"

const USER_ID = process.env.JOURNAL_SKILL_USER_ID!

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export async function POST(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "")
  if (token !== process.env.JOURNAL_SKILL_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json() as {
    content: string
    date?: string
    primary_energy?: EnergyKey | null
    secondary_energy?: EnergyKey | null
  }

  if (!body.content?.trim()) {
    return Response.json({ error: "content is required" }, { status: 400 })
  }

  const date = body.date ?? new Date().toISOString().split("T")[0]
  const content = body.content.startsWith("<") ? body.content : `<p>${body.content}</p>`

  const supabase = getAdminClient()

  const { data: existing } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("user_id", USER_ID)
    .eq("date", date)
    .maybeSingle()

  let savedId: string

  if (existing) {
    savedId = existing.id
    const { error } = await supabase
      .from("journal_entries")
      .update({
        content,
        primary_energy: body.primary_energy ?? null,
        secondary_energy: body.secondary_energy ?? null,
      })
      .eq("id", savedId)

    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else {
    savedId = generateUUID()
    const { error } = await supabase
      .from("journal_entries")
      .insert({
        id: savedId,
        user_id: USER_ID,
        date,
        primary_energy: body.primary_energy ?? null,
        secondary_energy: body.secondary_energy ?? null,
        content,
        created_at: new Date().toISOString(),
      })

    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  const { data: saved } = await supabase
    .from("journal_entries")
    .select("id, date, content, primary_energy, secondary_energy")
    .eq("id", savedId)
    .single()

  return Response.json({ ok: true, entry: saved })
}
