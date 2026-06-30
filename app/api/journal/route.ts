import { EnergyKey } from "@/lib/types"
import { getUserFromApiKey, getAdminSupabase, unauthorized } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const user = await getUserFromApiKey(req)
  if (!user) return unauthorized()

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

  const supabase = getAdminSupabase()

  const { data: existing } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("user_id", user.user_id)
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
    savedId = crypto.randomUUID()
    const { error } = await supabase
      .from("journal_entries")
      .insert({
        id: savedId,
        user_id: user.user_id,
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
