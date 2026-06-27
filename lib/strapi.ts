const STRAPI_URL = process.env.STRAPI_URL!
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN!

async function strapiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${STRAPI_URL}/api${path}?populate=*`, {
    headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
    next: { revalidate: 3600 }, // cache 1h, revalidate on demand
  })
  if (!res.ok) throw new Error(`Strapi fetch failed: ${path} (${res.status})`)
  const json = await res.json()
  return json.data as T
}

export type StrapiEnergy = {
  id: number
  key: string
  name: string
  emoji: string
  tagline: string
  description: string
  traits: string[]
  color: string
  bgColor: string
  borderColor: string
  textColor: string
}

export type StrapiCouchStory = {
  id: number
  key: string
  locale: string
  dayTitle: string
  story: string
  reflection: string
}

export type StrapiCompanion = {
  id: number
  id_key: string
  name: string
  emoji: string
  tagline: string
  systemPrompt: string
  tier: "free" | "paid"
  locale: string
}

export type StrapiUiTranslation = {
  en: Record<string, unknown>
  pl: Record<string, unknown>
}

export async function getEnergies(): Promise<StrapiEnergy[]> {
  return strapiGet<StrapiEnergy[]>("/energies")
}

export async function getCouchStories(locale: "en" | "pl"): Promise<StrapiCouchStory[]> {
  return strapiGet<StrapiCouchStory[]>(`/couch-stories?filters[locale][$eq]=${locale}`)
}

export async function getCompanions(locale: "en" | "pl"): Promise<StrapiCompanion[]> {
  return strapiGet<StrapiCompanion[]>(`/companions?filters[locale][$eq]=${locale}`)
}

export async function getUiTranslations(): Promise<StrapiUiTranslation> {
  return strapiGet<StrapiUiTranslation>("/ui-translation")
}
