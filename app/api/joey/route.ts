import { streamText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { getUserFromRequest } from "@/lib/auth-server"
import { buildJoeySystemPrompt } from "@/lib/joey"
import { JournalEntry } from "@/lib/types"

export const runtime = "nodejs"

// Claude Desktop sets ANTHROPIC_BASE_URL=https://api.anthropic.com (missing /v1)
// which overrides the SDK default. We pin the correct URL here to avoid 404s.
const anthropic = createAnthropic({
  baseURL: "https://api.anthropic.com/v1",
  // JOEY_ANTHROPIC_API_KEY used locally to avoid Claude Desktop overriding ANTHROPIC_API_KEY with empty string
  apiKey: process.env.JOEY_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { messages, currentEntry, recentEntries, lang } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[]
    currentEntry: JournalEntry | null
    recentEntries: JournalEntry[]
    lang: "en" | "pl"
  }

  const system = buildJoeySystemPrompt(
    currentEntry ?? null,
    recentEntries ?? [],
    lang ?? "en"
  )

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system,
    messages,
    maxOutputTokens: 300,
  })

  return result.toTextStreamResponse()
}
