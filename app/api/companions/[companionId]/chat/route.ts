import { streamText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { getUserFromRequest, getAdminSupabase } from "@/lib/auth-server"
import { CompanionId, COMPANIONS, buildCompanionSystemPrompt } from "@/lib/companions"
import { hasCompanionAccess } from "@/lib/companion-access"
import { JournalEntry } from "@/lib/types"
import { needsHistoricalContext } from "@/lib/joey"

export const runtime = "nodejs"

const anthropic = createAnthropic({
  baseURL: "https://api.anthropic.com/v1",
  apiKey: process.env.JOEY_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY,
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ companionId: string }> }
) {
  const { companionId } = await params

  if (!COMPANIONS[companionId as CompanionId]) {
    return Response.json({ error: "Unknown companion" }, { status: 404 })
  }

  const companion = COMPANIONS[companionId as CompanionId]

  const user = await getUserFromRequest(req)
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  if (!companion.free) {
    const supabase = getAdminSupabase()
    const allowed = await hasCompanionAccess(user.id, companionId as CompanionId, supabase)
    if (!allowed) return Response.json({ error: "Companion not unlocked" }, { status: 403 })
  }

  const { messages, currentEntry, recentEntries, lang } = await req.json() as {
    messages: { role: "user" | "assistant"; content: string }[]
    currentEntry: JournalEntry | null
    recentEntries: JournalEntry[]
    lang: "en" | "pl"
  }

  const lastMessage = messages[messages.length - 1]?.content ?? ""
  const usedHistoryLabel = needsHistoricalContext(lastMessage)
    ? "Relevant journal entries (semantic + keyword search):"
    : undefined

  const system = buildCompanionSystemPrompt(
    companionId as CompanionId,
    currentEntry ?? null,
    recentEntries ?? [],
    lang ?? "en",
    usedHistoryLabel
  )

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system,
    messages,
    maxOutputTokens: 300,
  })

  return result.toTextStreamResponse()
}
