"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getUserName, getGreetingKey, getTodayDate, getEntryByDate, saveEntry } from "@/lib/storage"
import { supabase } from "@/lib/supabase"
import { EnergyKey } from "@/lib/types"
import { ENERGIES, ENERGY_ORDER } from "@/lib/energies"
import { getCouchStory } from "@/lib/couchStories"
import { useI18n } from "@/lib/i18n"
import { EnergyCard } from "@/components/EnergyCard"
import { CouchSelector } from "@/components/CouchSelector"
import { CouchStoryBlock } from "@/components/CouchStoryBlock"
import { JournalEditor } from "@/components/JournalEditor"
import { BottomNav } from "@/components/BottomNav"
import { DesktopNav } from "@/components/DesktopNav"

function formatDateBar(lang: string): string {
  const d = new Date()
  return d.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).toUpperCase()
}

export default function CheckInPage() {
  const router = useRouter()
  const { t, lang } = useI18n()
  const [userName, setUserName] = useState<string | null>(null)
  const [primaryEnergy, setPrimaryEnergy] = useState<EnergyKey | undefined>()
  const [secondaryEnergy, setSecondaryEnergy] = useState<EnergyKey | undefined>()
  const [content, setContent] = useState("")
  const [saved, setSaved] = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)

  const [prompt] = useState(() => {
    const opts = ["home.journalPlaceholders.0", "home.journalPlaceholders.1", "home.journalPlaceholders.2", "home.journalPlaceholders.3"]
    return opts[Math.floor(Math.random() * opts.length)]
  })

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace("/login")
        return
      }

      const name = getUserName()
      if (!name) {
        router.replace("/onboarding")
        return
      }
      setUserName(name)

      const today = getTodayDate()
      const existing = await getEntryByDate(today)
      if (existing) {
        setContent(existing.content)
        setPrimaryEnergy(existing.primaryEnergy)
        setSecondaryEnergy(existing.secondaryEnergy)
        setExistingId(existing.id)
      }
    }
    init()
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

  async function handleSave() {
    const today = getTodayDate()
    await saveEntry({
      id: existingId ?? (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)),
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
    <div className="h-dvh flex flex-col bg-[#ece7df]">
      <DesktopNav />
      <div className="flex-1 overflow-y-auto pb-24 lg:pb-6">

        {/* Header */}
        <div className="pt-5 pb-2 text-center px-5">
          <h1 className="font-display text-5xl text-black uppercase leading-none">
            {t("home.title")}
          </h1>
        </div>

        {/* Date bar — container width, yellow */}
        <div className="max-w-lg lg:max-w-2xl mx-auto bg-[#fde52f] border-t border-b-4 border-l border-r border-[#6a4f79] flex items-center justify-center h-9">
          <p className="font-date italic text-[#6a4f79] text-lg leading-none">
            {formatDateBar(lang)}
          </p>
        </div>

        {/* Padded content */}
        <div className="max-w-lg lg:max-w-2xl mx-auto px-5 pt-5 pb-6 space-y-5">

          {/* Greeting */}
          <p className="font-display text-2xl text-black uppercase">
            {greeting}, {userName}
          </p>

          {/* Couch selector */}
          <CouchSelector primary={primaryEnergy} secondary={secondaryEnergy} />

          {/* Couch question */}
          <div className="space-y-1">
            <h2 className="font-display text-3xl text-black uppercase leading-tight">
              {t("home.couchQuestion")}
            </h2>
            <p className="font-serif text-base text-black">
              {t("home.couchHint")}
            </p>
          </div>

          {/* Energy cards 3×2 grid */}
          <div className="grid grid-cols-3 gap-0">
            {ENERGY_ORDER.map((key) => (
              <EnergyCard
                key={key}
                energy={ENERGIES[key]}
                selected={key === primaryEnergy || key === secondaryEnergy}
                onClick={() => handleEnergySelect(key)}
              />
            ))}
          </div>

          {/* Couch story + reflection */}
          <CouchStoryBlock story={couchStory} />

          {/* Journal section */}
          <div className="space-y-2">
            <p className="font-display text-2xl text-black uppercase">
              {t("home.journalSection")}
            </p>
            <JournalEditor
              content={content}
              onChange={(html) => { setContent(html); setSaved(false) }}
              placeholder={t(prompt)}
            />
          </div>

          {/* Save button */}
          <div className="flex justify-center">
            <button
              onClick={handleSave}
              className="figma-btn"
            >
              <span className="font-display text-[#fde52f] text-2xl leading-none uppercase translate-y-[2px]">
                {saved ? t("home.savedButton") : t("home.saveButton")}
              </span>
            </button>
          </div>
        </div>

        {/* Quote bar — matches padded container width */}
        <div className="max-w-lg lg:max-w-2xl mx-auto px-5 mt-2">
          <div className="border-4 border-[#6a4f79] bg-[#fde52f] flex items-start gap-4 px-6 py-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/quotes.png"
              alt=""
              aria-hidden="true"
              className="w-10 h-10 object-contain flex-shrink-0"
            />
            <div className="flex-1">
              <p className="font-serif text-base text-black leading-snug">
                It&apos;s like a cow&apos;s opinion. It doesn&apos;t matter. It&apos;s moo.
              </p>
              <p className="font-serif italic text-base text-black mt-1 text-right">
                — Joey Tribbiani
              </p>
            </div>
          </div>
        </div>

      </div>

      <BottomNav />
    </div>
  )
}
