import { EnergyKey } from "./types"
import type { Lang } from "./i18n"
import en from "../locales/en.json"
import pl from "../locales/pl.json"

export type CouchStory = {
  dayTitle: string
  story: string
  reflection: string
}

type StoryMap = Record<string, CouchStory>

function getLocale(lang: Lang) {
  return lang === "pl" ? pl : en
}

export function getCouchStory(
  primary: EnergyKey | undefined,
  secondary: EnergyKey | undefined,
  lang: Lang = "en"
): CouchStory {
  const locale = getLocale(lang)
  const { openCouch, single, pairs } = locale.stories

  if (!primary) return openCouch as CouchStory

  const singleMap = single as StoryMap
  if (!secondary) return singleMap[primary] ?? (openCouch as CouchStory)

  const key = [primary, secondary].sort().join("_")
  const pairsMap = pairs as StoryMap
  return pairsMap[key] ?? singleMap[primary] ?? (openCouch as CouchStory)
}
