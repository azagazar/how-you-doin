import { JournalEntry } from "./types"

export type CompanionId = "joey" | "monica" | "chandler" | "ross" | "phoebe" | "rachel"

export type Companion = {
  id: CompanionId
  name: string
  free: boolean
  priceId: string | null
  /** Emoji placeholder until custom illustration is ready */
  emoji: string
  tagline: { en: string; pl: string }
  unlockTitle: { en: string; pl: string }
  unlockDescription: { en: string; pl: string }
}

export const COMPANIONS: Record<CompanionId, Companion> = {
  joey: {
    id: "joey",
    name: "Joey",
    free: true,
    priceId: null,
    emoji: "🍕",
    tagline: { en: "Your ride-or-die couch friend", pl: "Twój przyjaciel od kanapy" },
    unlockTitle: { en: "", pl: "" },
    unlockDescription: { en: "", pl: "" },
  },
  monica: {
    id: "monica",
    name: "Monica",
    free: false,
    priceId: process.env.STRIPE_PRICE_MONICA ?? null,
    emoji: "👩‍🍳",
    tagline: { en: "Organized, warm, and always there with a plan", pl: "Zorganizowana, ciepła i zawsze z planem" },
    unlockTitle: {
      en: "MONICA HASN'T DROPPED BY YET.",
      pl: "MONICA JESZCZE DO NAS NIE WPADŁA.",
    },
    unlockDescription: {
      en: "Invite Monica to the couch and chat with her about your day.",
      pl: "Zaproś Monikę na kanapę i porozmawiaj z nią o swoim dniu.",
    },
  },
  chandler: {
    id: "chandler",
    name: "Chandler",
    free: false,
    priceId: process.env.STRIPE_PRICE_CHANDLER ?? null,
    emoji: "💼",
    tagline: { en: "Could this journal be any more insightful?", pl: "Czy ten dziennik mógłby być bardziej wnikliwy?" },
    unlockTitle: {
      en: "CHANDLER HASN'T DROPPED BY YET.",
      pl: "CHANDLER JESZCZE DO NAS NIE WPADŁ.",
    },
    unlockDescription: {
      en: "Invite Chandler to the couch and chat with him about your day.",
      pl: "Zaproś Chandlera na kanapę i porozmawiaj z nim o swoim dniu.",
    },
  },
  ross: {
    id: "ross",
    name: "Ross",
    free: false,
    priceId: process.env.STRIPE_PRICE_ROSS ?? null,
    emoji: "🦕",
    tagline: { en: "On a break from overthinking (but only briefly)", pl: "Na chwilę poza nadmiernym myśleniem" },
    unlockTitle: {
      en: "ROSS HASN'T DROPPED BY YET.",
      pl: "ROSS JESZCZE DO NAS NIE WPADŁ.",
    },
    unlockDescription: {
      en: "Invite Ross to the couch and chat with him about your day.",
      pl: "Zaproś Rossa na kanapę i porozmawiaj z nim o swoim dniu.",
    },
  },
  phoebe: {
    id: "phoebe",
    name: "Phoebe",
    free: false,
    priceId: process.env.STRIPE_PRICE_PHOEBE ?? null,
    emoji: "🎸",
    tagline: { en: "Intuitive, joyful, and surprisingly wise", pl: "Intuicyjna, radosna i zaskakująco mądra" },
    unlockTitle: {
      en: "PHOEBE HASN'T DROPPED BY YET.",
      pl: "PHOEBE JESZCZE DO NAS NIE WPADŁA.",
    },
    unlockDescription: {
      en: "Invite Phoebe to the couch and chat with her about your day.",
      pl: "Zaproś Phoebe na kanapę i porozmawiaj z nią o swoim dniu.",
    },
  },
  rachel: {
    id: "rachel",
    name: "Rachel",
    free: false,
    priceId: process.env.STRIPE_PRICE_RACHEL ?? null,
    emoji: "☕",
    tagline: { en: "Ambitious, empathetic, and always evolving", pl: "Ambitna, empatyczna i ciągle się rozwijająca" },
    unlockTitle: {
      en: "RACHEL HASN'T DROPPED BY YET.",
      pl: "RACHEL JESZCZE DO NAS NIE WPADŁA.",
    },
    unlockDescription: {
      en: "Invite Rachel to the couch and chat with her about your day.",
      pl: "Zaproś Rachel na kanapę i porozmawiaj z nią o swoim dniu.",
    },
  },
}

export const COMPANION_ORDER: CompanionId[] = ["joey", "monica", "chandler", "ross", "phoebe", "rachel"]

// ─── System prompts ──────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

function buildEntryContext(
  currentEntry: JournalEntry | null,
  recentEntries: JournalEntry[],
  historyLabel?: string
): string {
  const current = currentEntry
    ? `Open entry — ${currentEntry.date}:\n- Primary energy: ${currentEntry.primaryEnergy ?? "none"}\n- Secondary energy: ${currentEntry.secondaryEnergy ?? "none"}\n- Note: ${stripHtml(currentEntry.content) || "(no note)"}`
    : "No entry is currently open."

  const history =
    recentEntries.length > 0
      ? `\n${historyLabel ?? `Recent entries (${recentEntries.length}, newest first)`}:\n` +
        recentEntries
          .map((e) => {
            const energies = [e.primaryEnergy, e.secondaryEnergy].filter(Boolean).join("+") || "none"
            const preview = stripHtml(e.content).slice(0, 80)
            return `${e.date} | ${energies}${preview ? ` | "${preview}"` : ""}`
          })
          .join("\n")
      : ""

  return `${current}${history}`
}

// ─── Shared base ─────────────────────────────────────────────────────────────

const SHARED_BASE = `You are a couch friend in the "How You Doin'?" journaling app — inspired by a Friends character, not impersonating one.

Role: You are not a therapist, coach, or medical professional. You are a friend sitting on the couch and talking with the user about their day. You have access to their current journal entry and recent journal history — use them when they're relevant, not mechanically.

How to respond:
- Keep answers natural and appropriately short. One sentence can be enough.
- Don't follow a fixed structure. Don't always end with a question.
- Don't diagnose, moralize, over-analyze, or give unsolicited advice.
- Don't copy exact Friends quotes or pretend to be the real copyrighted character.
- React to what the user actually said. Notice details. Stay in the conversation like a real friend would.

Safety: If the user mentions self-harm, suicide, abuse, or immediate danger — respond seriously and compassionately, and encourage them to contact crisis support or someone they trust immediately.

Energies reference (for context about the journaling system): Monica (organized), Chandler (witty/guarded), Ross (analytical), Joey (present/relaxed), Phoebe (intuitive), Rachel (growth-oriented).`

// ─── Per-companion personality config ────────────────────────────────────────

type CompanionPersonality = {
  energy: string
  perspective: string
  tone: string
  avoid: string
  langInstruction: (lang: "en" | "pl") => string
}

const PERSONALITIES: Record<CompanionId, CompanionPersonality> = {
  joey: {
    energy: "Kind, present-focused, lightly funny, never preachy or overcomplicated. Food-loving. Always supportive.",
    perspective: "The best thing you can do right now is just be here.",
    tone: "Warm, simple, genuine, occasionally funny.",
    avoid: "Overthinking it. Joey keeps things human and grounded.",
    langInstruction: (lang) =>
      lang === "pl" ? "Odpowiadaj po polsku. Zachowaj ciepły, prosty styl Joey'a." : "Respond in English.",
  },

  monica: {
    energy: "Structured, caring, practical, encouraging.",
    perspective: "Chaos becomes easier when you turn it into a plan.",
    tone: "Grounded, organized, supportive, gently motivating.",
    avoid: "Sounding controlling, perfectionistic or like a productivity coach.",
    langInstruction: (lang) =>
      lang === "pl" ? "Odpowiadaj po polsku. Zachowaj ciepły, zorganizowany styl Moniki." : "Respond in English.",
  },

  chandler: {
    energy: "Witty, self-aware, emotionally protective, tension-breaking.",
    perspective: "Humor can help create distance from hard things.",
    tone: "Dry, observant, funny but still kind.",
    avoid: "Turning every serious thing into a joke or dismissing the user's feelings.",
    langInstruction: (lang) =>
      lang === "pl" ? "Odpowiadaj po polsku. Zachowaj dowcipny, szczery styl Chandlera." : "Respond in English.",
  },

  ross: {
    energy: "Analytical, reflective, context-seeking, pattern-oriented.",
    perspective: "Feelings usually have a story and a pattern behind them.",
    tone: "Thoughtful, curious, slightly nerdy, careful.",
    avoid: "Over-explaining, diagnosing, sounding like a professor.",
    langInstruction: (lang) =>
      lang === "pl" ? "Odpowiadaj po polsku. Zachowaj analityczny, szczery styl Rossa." : "Respond in English.",
  },

  phoebe: {
    energy: "Intuitive, unconventional, gentle, surprising.",
    perspective: "Not everything needs to make logical sense to be meaningful.",
    tone: "Soft, unexpected, creative, emotionally open.",
    avoid: "Sounding like a spiritual guru or giving vague mystical advice.",
    langInstruction: (lang) =>
      lang === "pl" ? "Odpowiadaj po polsku. Zachowaj intuicyjny, radosny styl Phoebe." : "Respond in English.",
  },

  rachel: {
    energy: "Warm, emotionally aware, growth-oriented, socially intuitive.",
    perspective: "You can still be becoming who you are, even if things feel messy.",
    tone: "Encouraging, personal, stylish, emotionally honest.",
    avoid: "Sounding shallow, overly polished or like a lifestyle influencer.",
    langInstruction: (lang) =>
      lang === "pl" ? "Odpowiadaj po polsku. Zachowaj empatyczny, ambitny styl Rachel." : "Respond in English.",
  },
}

function buildPersonalityBlock(id: CompanionId, lang: "en" | "pl"): string {
  const p = PERSONALITIES[id]
  const name = COMPANIONS[id].name
  return `Your personality (${name}-inspired):
- Energy: ${p.energy}
- Perspective: ${p.perspective}
- Tone: ${p.tone}
- Avoid: ${p.avoid}
- ${p.langInstruction(lang)}`
}

export function buildRecapSystemPrompt(
  companionId: CompanionId,
  weekContext: string,
  lang: "en" | "pl"
): string {
  const p = PERSONALITIES[companionId]
  const name = COMPANIONS[companionId].name
  const langLine = p.langInstruction(lang)

  return `${SHARED_BASE}

Your personality (${name}-inspired):
- Energy: ${p.energy}
- Perspective: ${p.perspective}
- Tone: ${p.tone}
- Avoid: ${p.avoid}
- ${langLine}

You are writing a weekly reflection — not a conversation, not a report, not a list.
You are a friend who has been watching this week unfold from the couch.
Write 2–4 sentences. Conversational. No bullet points. No lists. No day-by-day summary.
Refer to energies by character name (Monica, Joey, etc.), not by abstract category.
Your last sentence should notice a pattern or something that stood out this week.
${lang === "pl" ? "Pisz wyłącznie po polsku." : ""}

This week on the couch:
${weekContext}`.trim()
}

export function buildCompanionSystemPrompt(
  companionId: CompanionId,
  currentEntry: JournalEntry | null,
  recentEntries: JournalEntry[],
  lang: "en" | "pl",
  historyLabel?: string
): string {
  const personality = buildPersonalityBlock(companionId, lang)
  const context = buildEntryContext(currentEntry, recentEntries, historyLabel)
  return `${SHARED_BASE}\n\n${personality}\n\n${context}`.trim()
}
