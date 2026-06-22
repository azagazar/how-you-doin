import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { getUserFromRequest, getAdminSupabase } from "@/lib/auth-server"
import { CompanionId, COMPANIONS, buildRecapSystemPrompt } from "@/lib/companions"

export const runtime = "nodejs"

const anthropic = createAnthropic({
  baseURL: "https://api.anthropic.com/v1",
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function stripHtml(html: string): string {
  return (html ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as { companionId: CompanionId; lang: "en" | "pl" }
  const { companionId, lang } = body

  const companion = COMPANIONS[companionId]
  if (!companion) return Response.json({ error: "Invalid companion" }, { status: 400 })

  const supabase = getAdminSupabase()

  if (!companion.free) {
    const [{ data: sub }, { data: unlock }] = await Promise.all([
      supabase
        .from("user_subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("companion_unlocks")
        .select("companion_id")
        .eq("user_id", user.id)
        .eq("companion_id", companionId)
        .maybeSingle(),
    ])
    const hasActiveSub =
      sub?.status === "active" &&
      sub.current_period_end &&
      new Date(sub.current_period_end) > new Date()

    if (!hasActiveSub && !unlock) {
      return Response.json({ error: "Companion not unlocked" }, { status: 403 })
    }
  }

  // Last 7 days (today inclusive)
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - 6)
  const fromDateStr = fromDate.toISOString().split("T")[0]

  const { data: rows } = await supabase
    .from("journal_entries")
    .select("id, date, primary_energy, secondary_energy, content, photo_url")
    .eq("user_id", user.id)
    .gte("date", fromDateStr)
    .order("date", { ascending: true })

  if (!rows || rows.length < 2) {
    return Response.json({ recap: null, tooFewEntries: true })
  }

  const weekContext = rows
    .map((e) => {
      const energies =
        [e.primary_energy, e.secondary_energy].filter(Boolean).join("+") || "none"
      const preview = stripHtml(e.content).slice(0, 100)
      const photo = e.photo_url ? " 📸" : ""
      return `${e.date} | ${energies}${preview ? ` | "${preview}"` : ""}${photo}`
    })
    .join("\n")

  const system = buildRecapSystemPrompt(companionId, weekContext, lang)

  const userMessage =
    lang === "pl"
      ? "Napisz krótką refleksję na temat tego tygodnia."
      : "Write a short reflection on this week."

  const { text } = await generateText({
    model: anthropic("claude-haiku-4-5"),
    system,
    messages: [{ role: "user", content: userMessage }],
    maxOutputTokens: 200,
  })

  return Response.json({ recap: text })
}
