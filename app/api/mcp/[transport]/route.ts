import { createMcpHandler, withMcpAuth } from "mcp-handler"
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js"
import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { getAdminSupabase, hashToken } from "@/lib/api-auth"
import { getCouchStory } from "@/lib/couchStories"
import { buildJoeySystemPrompt, needsHistoricalContext } from "@/lib/joey"
import { JournalEntry, EnergyKey } from "@/lib/types"

export const runtime = "nodejs"
export const maxDuration = 60

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_ENERGIES: EnergyKey[] = ["monica", "chandler", "ross", "joey", "phoebe", "rachel"]

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

function toHtml(text: string) {
  if (text.trimStart().startsWith("<")) return text
  return text.split(/\n\s*\n/).map(p => `<p>${p.trim()}</p>`).join("")
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function toEntry(row: {
  id: string; date: string; primary_energy: string | null
  secondary_energy: string | null; content: string; created_at: string
}): JournalEntry {
  return {
    id: row.id, date: row.date, content: row.content, createdAt: row.created_at,
    primaryEnergy: (row.primary_energy as EnergyKey) ?? undefined,
    secondaryEnergy: (row.secondary_energy as EnergyKey) ?? undefined,
  }
}

// ─── MCP handler ─────────────────────────────────────────────────────────────

const handler = createMcpHandler(
  (server) => {

    // 1. Get today's entry (or any date)
    server.tool(
      "journal_get_today",
      "Get the journal entry for today or a specific date, including the couch story and reflection prompt.",
      { date: z.string().optional().describe("Date in YYYY-MM-DD. Defaults to today.") },
      async ({ date }, extra) => {
        const userId = extra.authInfo?.extra?.userId as string
        const lang = (extra.authInfo?.extra?.lang as "en" | "pl") ?? "en"
        const targetDate = date ?? new Date().toISOString().split("T")[0]
        const supabase = getAdminSupabase()

        const { data: entry } = await supabase
          .from("journal_entries")
          .select("id, date, primary_energy, secondary_energy, content, created_at")
          .eq("user_id", userId)
          .eq("date", targetDate)
          .maybeSingle()

        if (!entry) {
          const story = getCouchStory(undefined, undefined, lang)
          return { content: [{ type: "text" as const, text: JSON.stringify({
            date: targetDate, exists: false, primary_energy: null,
            secondary_energy: null, note: null, couch_story: story
          })}]}
        }

        const primary = entry.primary_energy as EnergyKey | undefined
        const secondary = entry.secondary_energy as EnergyKey | undefined
        const story = getCouchStory(primary, secondary, lang)

        return { content: [{ type: "text" as const, text: JSON.stringify({
          date: entry.date, exists: true,
          primary_energy: entry.primary_energy ?? null,
          secondary_energy: entry.secondary_energy ?? null,
          note: stripHtml(entry.content),
          couch_story: story,
        })}]}
      }
    )

    // 2. Create or update an entry
    server.tool(
      "journal_save_entry",
      "Create or update a journal entry. If an entry already exists for that date it will be updated. Energies are optional.",
      {
        note: z.string().describe("The journal text to save."),
        date: z.string().optional().describe("Date in YYYY-MM-DD. Defaults to today."),
        primary_energy: z.enum(["monica", "chandler", "ross", "joey", "phoebe", "rachel"]).optional().describe("Primary energy/mood for the day."),
        secondary_energy: z.enum(["monica", "chandler", "ross", "joey", "phoebe", "rachel"]).optional().describe("Secondary energy/mood for the day."),
      },
      async ({ note, date, primary_energy, secondary_energy }, extra) => {
        const userId = extra.authInfo?.extra?.userId as string
        const targetDate = date ?? new Date().toISOString().split("T")[0]
        const content = toHtml(note)
        const primary = VALID_ENERGIES.includes(primary_energy as EnergyKey) ? primary_energy as EnergyKey : null
        const secondary = VALID_ENERGIES.includes(secondary_energy as EnergyKey) ? secondary_energy as EnergyKey : null

        const supabase = getAdminSupabase()
        const { data: existing } = await supabase
          .from("journal_entries").select("id")
          .eq("user_id", userId).eq("date", targetDate).maybeSingle()

        let savedId: string
        let action: string

        if (existing) {
          savedId = existing.id
          action = "updated"
          await supabase.from("journal_entries")
            .update({ content, primary_energy: primary, secondary_energy: secondary })
            .eq("id", savedId)
        } else {
          savedId = generateUUID()
          action = "created"
          await supabase.from("journal_entries").insert({
            id: savedId, user_id: userId, date: targetDate,
            primary_energy: primary, secondary_energy: secondary,
            content, created_at: new Date().toISOString(),
          })
        }

        return { content: [{ type: "text" as const, text: JSON.stringify({
          ok: true, action, entry: {
            id: savedId, date: targetDate,
            primary_energy: primary, secondary_energy: secondary,
            note: stripHtml(content),
          }
        })}]}
      }
    )

    // 3. List entries
    server.tool(
      "journal_list_entries",
      "List journal entries, newest first. Useful for reviewing recent history.",
      {
        limit: z.number().min(1).max(50).optional().describe("Max entries to return. Default 10."),
        from: z.string().optional().describe("Start date YYYY-MM-DD, inclusive."),
        to: z.string().optional().describe("End date YYYY-MM-DD, inclusive."),
      },
      async ({ limit = 10, from, to }, extra) => {
        const userId = extra.authInfo?.extra?.userId as string
        const supabase = getAdminSupabase()

        let query = supabase
          .from("journal_entries")
          .select("id, date, primary_energy, secondary_energy, content, created_at")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(limit)

        if (from) query = query.gte("date", from)
        if (to) query = query.lte("date", to)

        const { data } = await query
        const entries = (data ?? []).map(e => ({
          id: e.id, date: e.date,
          primary_energy: e.primary_energy ?? null,
          secondary_energy: e.secondary_energy ?? null,
          note: stripHtml(e.content),
        }))

        return { content: [{ type: "text" as const, text: JSON.stringify({ entries, total: entries.length }) }]}
      }
    )

    // 4. Ask Joey
    server.tool(
      "joey_ask",
      "Send a message to Joey — the app's warm, present-focused AI companion. Joey responds based on the journal entry for the given date and recent history when relevant.",
      {
        message: z.string().describe("The question or message for Joey."),
        date: z.string().optional().describe("Date context for Joey. Defaults to today."),
      },
      async ({ message, date }, extra) => {
        const userId = extra.authInfo?.extra?.userId as string
        const lang = (extra.authInfo?.extra?.lang as "en" | "pl") ?? "en"
        const targetDate = date ?? new Date().toISOString().split("T")[0]
        const wantsHistory = needsHistoricalContext(message)
        const supabase = getAdminSupabase()

        const { data: entryRow } = await supabase
          .from("journal_entries")
          .select("id, date, primary_energy, secondary_energy, content, created_at")
          .eq("user_id", userId).eq("date", targetDate).maybeSingle()

        const currentEntry = entryRow ? toEntry(entryRow) : null

        let recentEntries: JournalEntry[] = []
        if (wantsHistory) {
          const { data: rows } = await supabase
            .from("journal_entries")
            .select("id, date, primary_energy, secondary_energy, content, created_at")
            .eq("user_id", userId).neq("date", targetDate)
            .order("date", { ascending: false }).limit(10)
          recentEntries = (rows ?? []).map(toEntry)
        }

        const anthropic = createAnthropic({
          baseURL: "https://api.anthropic.com/v1",
          apiKey: process.env.JOEY_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY,
        })

        const { text } = await generateText({
          model: anthropic("claude-haiku-4-5"),
          system: buildJoeySystemPrompt(currentEntry, recentEntries, lang),
          messages: [{ role: "user", content: message }],
          maxOutputTokens: 300,
        })

        return { content: [{ type: "text" as const, text: JSON.stringify({
          reply: text,
          context: { date: targetDate, used_history: wantsHistory, entries_loaded: recentEntries.length + (currentEntry ? 1 : 0) }
        })}]}
      }
    )
  },
  { capabilities: {} },
  {
    basePath: "/api/mcp",
    streamableHttpEndpoint: "/mcp",
    sseEndpoint: "/sse",
    sseMessageEndpoint: "/message",
    redisUrl: process.env.REDIS_URL,
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────

const verifyToken = async (_req: Request, token?: string): Promise<AuthInfo | undefined> => {
  if (!token) return undefined
  const hash = await hashToken(token)
  const supabase = getAdminSupabase()
  const { data } = await supabase
    .from("user_profiles")
    .select("user_id, lang")
    .eq("api_key", hash)
    .maybeSingle()
  if (!data) return undefined
  return {
    token,
    scopes: ["journal"],
    clientId: data.user_id,
    extra: { userId: data.user_id, lang: data.lang },
  }
}

const authHandler = withMcpAuth(handler, verifyToken, { required: true })

export { authHandler as GET, authHandler as POST }
