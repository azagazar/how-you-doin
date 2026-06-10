import { getUserFromApiKey, unauthorized, getAdminSupabase } from "@/lib/api-auth"
import { EnergyKey } from "@/lib/types"

export const runtime = "nodejs"

const VALID_ENERGIES: EnergyKey[] = ["monica", "chandler", "ross", "joey", "phoebe", "rachel"]

function toHtml(text: string): string {
  if (text.trimStart().startsWith("<")) return text
  return text
    .split(/\n\s*\n/)
    .map((p) => `<p>${p.trim()}</p>`)
    .join("")
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

export async function POST(req: Request) {
  const user = await getUserFromApiKey(req)
  if (!user) return unauthorized()

  const body = await req.json() as {
    note?: string
    date?: string
    primary_energy?: string | null
    secondary_energy?: string | null
  }

  const date = body.date ?? new Date().toISOString().split("T")[0]
  const content = body.note ? toHtml(body.note) : ""

  const primary = VALID_ENERGIES.includes(body.primary_energy as EnergyKey)
    ? (body.primary_energy as EnergyKey)
    : null
  const secondary = VALID_ENERGIES.includes(body.secondary_energy as EnergyKey)
    ? (body.secondary_energy as EnergyKey)
    : null

  const supabase = getAdminSupabase()

  // Check for existing entry on this date
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
      .update({ content, primary_energy: primary, secondary_energy: secondary })
      .eq("id", savedId)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else {
    savedId = generateUUID()
    const { error } = await supabase
      .from("journal_entries")
      .insert({
        id: savedId,
        user_id: user.user_id,
        date,
        primary_energy: primary,
        secondary_energy: secondary,
        content,
        created_at: new Date().toISOString(),
      })
    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  // Verify
  const { data: saved } = await supabase
    .from("journal_entries")
    .select("id, date, primary_energy, secondary_energy, content")
    .eq("id", savedId)
    .single()

  return Response.json({
    ok: true,
    action: existing ? "updated" : "created",
    entry: {
      id: saved?.id,
      date: saved?.date,
      primary_energy: saved?.primary_energy ?? null,
      secondary_energy: saved?.secondary_energy ?? null,
      note: stripHtml(saved?.content ?? ""),
    },
  })
}
