import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { getUserFromApiKey, unauthorized, getAdminSupabase } from "@/lib/api-auth"
import { buildJoeySystemPrompt, needsHistoricalContext } from "@/lib/joey"
import { JournalEntry } from "@/lib/types"

export const runtime = "nodejs"

const anthropic = createAnthropic({
  baseURL: "https://api.anthropic.com/v1",
  apiKey: process.env.JOEY_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY,
})

function toJournalEntry(row: {
  id: string
  date: string
  primary_energy: string | null
  secondary_energy: string | null
  content: string
  created_at: string
}): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    primaryEnergy: (row.primary_energy as JournalEntry["primaryEnergy"]) ?? undefined,
    secondaryEnergy: (row.secondary_energy as JournalEntry["secondaryEnergy"]) ?? undefined,
    content: row.content,
    createdAt: row.created_at,
  }
}

export async function POST(req: Request) {
  const user = await getUserFromApiKey(req)
  if (!user) return unauthorized()

  const body = await req.json() as {
    message: string
    date?: string          // defaults to today
    include_history?: boolean
  }

  if (!body.message?.trim()) {
    return Response.json({ error: "message is required" }, { status: 400 })
  }

  const targetDate = body.date ?? new Date().toISOString().split("T")[0]
  const wantsHistory = body.include_history ?? needsHistoricalContext(body.message)

  const supabase = getAdminSupabase()

  // Fetch the entry for the target date
  const { data: entryRow } = await supabase
    .from("journal_entries")
    .select("id, date, primary_energy, secondary_energy, content, created_at")
    .eq("user_id", user.user_id)
    .eq("date", targetDate)
    .maybeSingle()

  const currentEntry: JournalEntry | null = entryRow ? toJournalEntry(entryRow) : null

  // Fetch recent entries only when needed
  let recentEntries: JournalEntry[] = []
  if (wantsHistory) {
    const { data: rows } = await supabase
      .from("journal_entries")
      .select("id, date, primary_energy, secondary_energy, content, created_at")
      .eq("user_id", user.user_id)
      .neq("date", targetDate)
      .order("date", { ascending: false })
      .limit(10)
    recentEntries = (rows ?? []).map(toJournalEntry)
  }

  const system = buildJoeySystemPrompt(currentEntry, recentEntries, user.lang)

  const { text } = await generateText({
    model: anthropic("claude-haiku-4-5"),
    system,
    messages: [{ role: "user", content: body.message }],
    maxOutputTokens: 300,
  })

  return Response.json({
    reply: text,
    context: {
      date: targetDate,
      used_history: wantsHistory,
      entries_loaded: recentEntries.length + (currentEntry ? 1 : 0),
    },
  })
}
