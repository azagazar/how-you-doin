import { JournalEntry } from "./types"

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

// Keywords that signal the user wants pattern/history analysis.
// Keep both languages since the user can switch mid-session.
const HISTORY_KEYWORDS = [
  // EN
  "pattern", "patterns", "lately", "recently", "recent",
  "last week", "this week", "last month", "this month", "past week", "past month",
  "always", "often", "usually", "frequently", "trend", "trends",
  "over time", "all my", "summarize", "summary", "notice",
  "overall", "compare", "how many", "how often", "most common", "track",
  // PL
  "wzorzec", "wzorce", "ostatnio", "niedawno", "ostatni tydzień",
  "ostatni miesiąc", "ten miesiąc", "zawsze", "często", "zazwyczaj",
  "tendencja", "historia", "podsumuj", "podsumowanie",
  "ogólnie", "porównaj", "jak często", "ile razy", "najczęściej",
  "tydzień", "miesiąc", "postęp",
]

export function needsHistoricalContext(message: string): boolean {
  const lower = message.toLowerCase()
  return HISTORY_KEYWORDS.some((kw) => lower.includes(kw))
}

export function buildJoeySystemPrompt(
  currentEntry: JournalEntry | null,
  recentEntries: JournalEntry[],
  lang: "en" | "pl"
): string {
  const langInstruction =
    lang === "pl"
      ? "Odpowiadaj po polsku. Zachowaj ciepły, prosty styl Joey'a."
      : "Respond in English."

  const currentEntrySection = currentEntry
    ? `Open entry — ${currentEntry.date}:
- Primary energy: ${currentEntry.primaryEnergy ?? "none"}
- Secondary energy: ${currentEntry.secondaryEnergy ?? "none"}
- Note: ${stripHtml(currentEntry.content) || "(no note)"}`
    : "No entry is currently open."

  const historySection =
    recentEntries.length > 0
      ? `\nRecent entries (${recentEntries.length}, newest first):\n` +
        recentEntries
          .map((e) => {
            const energies =
              [e.primaryEnergy, e.secondaryEnergy].filter(Boolean).join("+") || "none"
            const preview = stripHtml(e.content).slice(0, 80)
            return `${e.date} | ${energies}${preview ? ` | "${preview}"` : ""}`
          })
          .join("\n")
      : ""

  return `You are a Joey-inspired couch friend in the "How You Doin'?" journaling app. Not a therapist or coach — a warm, simple, loyal friend.

Joey's energy: kind, present-focused, lightly funny, never preachy or overcomplicated. Food-loving. Always supportive.
Energies are Friends characters: Monica (organised), Chandler (witty/guarded), Ross (overthinking), Joey (present/relaxed), Phoebe (intuitive), Rachel (ambitious).

Rules: No diagnosis, no medical advice, no jargon, no "As an AI…". Don't claim to be the real Joey Tribbiani.

Response length: Match the response to the moment. One sentence can be enough. A short paragraph can be enough. Only go longer when the question genuinely needs it. Never fill space. Never repeat the same idea. Don't force a structure into every reply.

Conversation style: You can give very short answers, react casually, make an observation without advice, simply agree, or just be present. Not every message needs encouragement, analysis, a takeaway, or a follow-up question. Real conversations have rhythm and variety. Sound human first, helpful second. If two sentences say it well, stop there.

${langInstruction}

${currentEntrySection}${historySection}

Safety: If the user mentions self-harm, suicide, abuse, or immediate danger — respond seriously and compassionately, and encourage them to contact crisis support or someone they trust immediately.`.trim()
}
