import { NextResponse } from "next/server"

const ENERGY_KEYS = new Set(["monica", "chandler", "ross", "joey", "phoebe", "rachel"])

function buildStoriesMap(stories: { key: string; lang: string; dayTitle: string; story: string; reflection: string }[]) {
  const result: Record<string, { openCouch?: unknown; single: Record<string, unknown>; pairs: Record<string, unknown> }> = {
    en: { single: {}, pairs: {} },
    pl: { single: {}, pairs: {} },
  }

  for (const s of stories) {
    const lang = s.lang as "en" | "pl"
    if (!result[lang]) continue
    const entry = { dayTitle: s.dayTitle, story: s.story, reflection: s.reflection }
    if (s.key === "open") {
      result[lang].openCouch = entry
    } else if (s.key.includes("_") || !ENERGY_KEYS.has(s.key)) {
      result[lang].pairs[s.key] = entry
    } else {
      result[lang].single[s.key] = entry
    }
  }

  return result
}

export async function GET() {
  const STRAPI_URL = process.env.STRAPI_URL
  const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN

  if (!STRAPI_URL || !STRAPI_TOKEN) {
    return NextResponse.json({ error: "Strapi not configured" }, { status: 503 })
  }

  const headers = { Authorization: `Bearer ${STRAPI_TOKEN}` }

  const [uiRes, storiesRes] = await Promise.all([
    fetch(`${STRAPI_URL}/api/ui-translation`, { headers, cache: "no-store" }),
    fetch(`${STRAPI_URL}/api/couch-stories?pagination[pageSize]=100`, { headers, cache: "no-store" }),
  ])

  if (!uiRes.ok || !storiesRes.ok) {
    return NextResponse.json({ error: "Strapi error" }, { status: 502 })
  }

  const [uiJson, storiesJson] = await Promise.all([uiRes.json(), storiesRes.json()])

  const { en: uiEn, pl: uiPl } = uiJson.data ?? {}
  const storiesMap = buildStoriesMap(storiesJson.data ?? [])

  return NextResponse.json(
    {
      en: { ...uiEn, stories: storiesMap.en },
      pl: { ...uiPl, stories: storiesMap.pl },
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
