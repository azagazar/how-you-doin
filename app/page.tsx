"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getUserName, getGreetingKey, getTodayDate, getEntryByDate, saveEntry } from "@/lib/storage"
import { EnergyKey } from "@/lib/types"
import { ENERGIES, ENERGY_ORDER } from "@/lib/energies"
import { getCouchStory } from "@/lib/couchStories"
import { useI18n } from "@/lib/i18n"
import { EnergyCard } from "@/components/EnergyCard"
import { CouchSelector } from "@/components/CouchSelector"
import { CouchStoryBlock } from "@/components/CouchStoryBlock"
import { JournalEditor } from "@/components/JournalEditor"
import { BottomNav } from "@/components/BottomNav"
import { Button } from "@/components/ui/button"

export default function CheckInPage() {
  const router = useRouter()
  const { t, lang } = useI18n()
  const [userName, setUserName] = useState<string | null>(null)
  const [primaryEnergy, setPrimaryEnergy] = useState<EnergyKey | undefined>()
  const [secondaryEnergy, setSecondaryEnergy] = useState<EnergyKey | undefined>()
  const [content, setContent] = useState("")
  const [saved, setSaved] = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)

  const placeholders = t("home.journalPlaceholders")
  const [prompt] = useState(() => {
    const opts = ["home.journalPlaceholders.0", "home.journalPlaceholders.1", "home.journalPlaceholders.2", "home.journalPlaceholders.3"]
    return opts[Math.floor(Math.random() * opts.length)]
  })

  useEffect(() => {
    const name = getUserName()
    if (!name) {
      router.replace("/onboarding")
      return
    }
    setUserName(name)

    const today = getTodayDate()
    const existing = getEntryByDate(today)
    if (existing) {
      setContent(existing.content)
      setExistingId(existing.id)
    }
  }, [router])

  const handleEnergySelect = useCallback((key: EnergyKey) => {
    setSaved(false)
    if (key === primaryEnergy) {
      setPrimaryEnergy(secondaryEnergy)
      setSecondaryEnergy(undefined)
      return
    }
    if (key === secondaryEnergy) {
      setSecondaryEnergy(undefined)
      return
    }
    if (!primaryEnergy) {
      setPrimaryEnergy(key)
    } else {
      setSecondaryEnergy(key)
    }
  }, [primaryEnergy, secondaryEnergy])

  function handleSave() {
    const today = getTodayDate()
    saveEntry({
      id: existingId ?? crypto.randomUUID(),
      date: today,
      primaryEnergy,
      secondaryEnergy,
      content,
      createdAt: new Date().toISOString(),
    })
    setSaved(true)
  }

  const couchStory = getCouchStory(primaryEnergy, secondaryEnergy, lang)

  if (!userName) return null

  const greetingKey = getGreetingKey()
  const greeting = t(`greeting.${greetingKey}`)

  return (
    <div className="min-h-dvh flex flex-col pb-24 bg-[#F5EFE6]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 pt-6 pb-6 space-y-5">
          <div className="space-y-0.5">
            <p className="text-sm text-[#9B7B5B] font-medium tracking-wide">{greeting}, {userName}</p>
            <h1 className="font-display text-4xl font-bold text-[#2C1A0E] leading-tight">{t("home.title")}</h1>
          </div>

          <CouchSelector primary={primaryEnergy} secondary={secondaryEnergy} />

          <div className="space-y-0.5">
            <h2 className="font-display text-2xl font-bold text-[#2C1A0E]">{t("home.couchQuestion")}</h2>
            <p className="text-sm text-[#9B8878]">{t("home.couchHint")}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {ENERGY_ORDER.map((key) => (
              <EnergyCard
                key={key}
                energy={ENERGIES[key]}
                selected={key === primaryEnergy || key === secondaryEnergy}
                onClick={() => handleEnergySelect(key)}
              />
            ))}
          </div>

          <CouchStoryBlock story={couchStory} />

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[#6B4F7A] uppercase tracking-wide">
              {t("home.journalSection")}
            </label>
            <JournalEditor
              content={content}
              onChange={(html) => { setContent(html); setSaved(false) }}
              placeholder={t(prompt)}
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full bg-[#6B4F7A] hover:bg-[#5A3F68] text-white rounded-xl py-3 text-base font-semibold"
          >
            {saved ? t("home.savedButton") : t("home.saveButton")}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
