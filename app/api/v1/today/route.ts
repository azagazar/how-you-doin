import { getUserFromApiKey, unauthorized, getAdminSupabase } from "@/lib/api-auth"
import { getCouchStory } from "@/lib/couchStories"
import { EnergyKey } from "@/lib/types"

export const runtime = "nodejs"

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

export async function GET(req: Request) {
  const user = await getUserFromApiKey(req)
  if (!user) return unauthorized()

  const today = new Date().toISOString().split("T")[0]
  const supabase = getAdminSupabase()

  const { data: entry, error } = await supabase
    .from("journal_entries")
    .select("id, date, primary_energy, secondary_energy, content, created_at")
    .eq("user_id", user.user_id)
    .eq("date", today)
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (!entry) {
    const emptyStory = getCouchStory(undefined, undefined, user.lang)
    return Response.json({
      date: today,
      exists: false,
      primary_energy: null,
      secondary_energy: null,
      note: null,
      couch_story: emptyStory,
    })
  }

  const primary = entry.primary_energy as EnergyKey | undefined
  const secondary = entry.secondary_energy as EnergyKey | undefined
  const story = getCouchStory(primary, secondary, user.lang)

  return Response.json({
    date: entry.date,
    exists: true,
    primary_energy: entry.primary_energy ?? null,
    secondary_energy: entry.secondary_energy ?? null,
    note: stripHtml(entry.content),
    couch_story: story,
  })
}
