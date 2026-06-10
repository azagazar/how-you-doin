import { getUserFromApiKey, unauthorized, getAdminSupabase } from "@/lib/api-auth"

export const runtime = "nodejs"

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

export async function GET(req: Request) {
  const user = await getUserFromApiKey(req)
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get("limit") ?? 10), 50)
  const from = searchParams.get("from")   // YYYY-MM-DD
  const to = searchParams.get("to")       // YYYY-MM-DD

  const supabase = getAdminSupabase()

  let query = supabase
    .from("journal_entries")
    .select("id, date, primary_energy, secondary_energy, content, created_at")
    .eq("user_id", user.user_id)
    .order("date", { ascending: false })
    .limit(limit)

  if (from) query = query.gte("date", from)
  if (to)   query = query.lte("date", to)

  const { data, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const entries = (data ?? []).map((e) => ({
    id: e.id,
    date: e.date,
    primary_energy: e.primary_energy ?? null,
    secondary_energy: e.secondary_energy ?? null,
    note: stripHtml(e.content),
  }))

  return Response.json({ entries, total: entries.length })
}
