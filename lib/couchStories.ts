import { EnergyKey } from "./types"
import type { Lang } from "./i18n"
import { useI18n } from "./i18n"
import en from "../locales/en.json"
import pl from "../locales/pl.json"

export type CouchStory = {
  dayTitle: string
  story: string
  reflection: string
}

type StoryMap = Record<string, CouchStory>

type LocaleWithStories = {
  stories: {
    openCouch: CouchStory
    single: StoryMap
    pairs: StoryMap
  }
}

function resolveStory(locale: LocaleWithStories, primary?: EnergyKey, secondary?: EnergyKey): CouchStory {
  const { openCouch, single, pairs } = locale.stories
  if (!primary) return openCouch
  if (!secondary) return single[primary] ?? openCouch
  const key = [primary, secondary].sort().join("_")
  return pairs[key] ?? single[primary] ?? openCouch
}

// Pure function — uses static JSON (fallback / SSR)
export function getCouchStory(
  primary: EnergyKey | undefined,
  secondary: EnergyKey | undefined,
  lang: Lang = "en"
): CouchStory {
  const locale = (lang === "pl" ? pl : en) as unknown as LocaleWithStories
  return resolveStory(locale, primary, secondary)
}

// Hook — uses live Strapi data via i18n context (for single calls in components)
export function useCouchStory(
  primary: EnergyKey | undefined,
  secondary: EnergyKey | undefined
): CouchStory {
  const { lang, rawTranslations } = useI18n()
  const locale = (lang === "pl" ? rawTranslations.pl : rawTranslations.en) as unknown as LocaleWithStories
  if (!locale?.stories) return getCouchStory(primary, secondary, lang)
  return resolveStory(locale, primary, secondary)
}

// Returns a resolver bound to current translations — use this inside .map() or loops
export function useCouchStoryResolver(): (primary?: EnergyKey, secondary?: EnergyKey) => CouchStory {
  const { lang, rawTranslations } = useI18n()
  const locale = (lang === "pl" ? rawTranslations.pl : rawTranslations.en) as unknown as LocaleWithStories
  if (!locale?.stories) return (p, s) => getCouchStory(p, s, lang)
  return (p, s) => resolveStory(locale, p, s)
}
