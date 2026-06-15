"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { getUserName, getGreetingKey, getTodayDate, getEntryByDate, saveEntry } from "@/lib/storage"
import { supabase } from "@/lib/supabase"
import { isDemoMode } from "@/lib/demo"
import { EnergyKey } from "@/lib/types"
import { uploadPhoto, deletePhoto } from "@/lib/photoStorage"
import { ENERGIES, ENERGY_ORDER } from "@/lib/energies"
import { getCouchStory } from "@/lib/couchStories"
import { useI18n } from "@/lib/i18n"
import { EnergyCard } from "@/components/EnergyCard"
import { CouchSelector } from "@/components/CouchSelector"
import { CouchStoryBlock } from "@/components/CouchStoryBlock"
import { JournalEditor } from "@/components/JournalEditor"
import { SnapshotFrame } from "@/components/SnapshotFrame"
import { BottomNav } from "@/components/BottomNav"
import { DesktopNav } from "@/components/DesktopNav"
import { ChemexLoaderScreen } from "@/components/ChemexLoader"
import { JoeyChat } from "@/components/JoeyChat"
import { JoeyInvite } from "@/components/JoeyInvite"

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
  const [appReady, setAppReady] = useState(false)

  const [joeyOpen, setJoeyOpen] = useState(false)
  const [frameVisible, setFrameVisible] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | undefined>()
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [prompt] = useState(() => {
    const opts = ["home.journalPlaceholders.0", "home.journalPlaceholders.1", "home.journalPlaceholders.2", "home.journalPlaceholders.3"]
    return opts[Math.floor(Math.random() * opts.length)]
  })

  useEffect(() => {
    const minDelay = new Promise<void>(r => setTimeout(r, 2000))
    let redirect: string | null = null

    async function init() {
      if (!isDemoMode()) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          redirect = "/login"
          return
        }
      }

      const name = getUserName()
      if (!name) {
        redirect = "/onboarding"
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
        if (existing.photoUrl) {
          setPhotoUrl(existing.photoUrl)
          setFrameVisible(true)
        }
      }
    }

    Promise.all([init(), minDelay]).then(() => {
      if (redirect) router.replace(redirect)
      else setAppReady(true)
    }).catch(() => {
      router.replace("/login")
    })
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
    const id = existingId ?? (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36))
    await saveEntry({ id, date: today, primaryEnergy, secondaryEnergy, content, createdAt: new Date().toISOString() })
    setExistingId(id)
    setSaved(true)
    setTimeout(() => router.push(`/history?entry=${id}`), 1400)
  }

  const couchStory = getCouchStory(primaryEnergy, secondaryEnergy, lang)

  function handleCameraClick() {
    fileInputRef.current?.click()
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!fileInputRef.current) return
    fileInputRef.current.value = ""
    if (!file) return

    if (isDemoMode()) {
      setPhotoError("Photo uploads require signing in with Google.")
      return
    }

    setPhotoError(null)
    setPhotoLoading(true)
    setFrameVisible(true)
    try {
      const today = getTodayDate()
      // Ensure the entry exists before attaching a photo
      if (!existingId) {
        const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)
        await saveEntry({ id, date: today, primaryEnergy, secondaryEnergy, content, createdAt: new Date().toISOString() })
        setExistingId(id)
      }
      const { url } = await uploadPhoto(file, today)
      setPhotoUrl(url)
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed")
      setFrameVisible(false)
    } finally {
      setPhotoLoading(false)
    }
  }

  async function handlePhotoDelete() {
    const today = getTodayDate()
    setPhotoLoading(true)
    try {
      await deletePhoto(today)
      setPhotoUrl(undefined)
      setFrameVisible(false)
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setPhotoLoading(false)
    }
  }

  // Derive currentEntry reactively so Joey always sees the latest state
  const currentEntryForJoey = useMemo(() => {
    if (!existingId) return null
    return {
      id: existingId,
      date: getTodayDate(),
      primaryEnergy,
      secondaryEnergy,
      content,
      createdAt: new Date().toISOString(),
    }
  }, [existingId, primaryEnergy, secondaryEnergy, content])

  if (!appReady) return <ChemexLoaderScreen />
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

          {/* Snapshot section — appears on first camera click, stays after delete */}
          {frameVisible && (
            <div className="w-4/5 mx-auto">
              <SnapshotFrame
                photoUrl={photoUrl}
                onAdd={handleCameraClick}
                onDelete={handlePhotoDelete}
                loading={photoLoading}
              />
            </div>
          )}
          {photoError && (
            <p className="font-serif text-sm text-red-500 text-center">{photoError}</p>
          )}

          {/* Journal section */}
          <div className="space-y-2">
            <p className="font-display text-2xl text-black uppercase">
              {t("home.journalSection")}
            </p>
            <JournalEditor
              content={content}
              onChange={(html) => { setContent(html); setSaved(false) }}
              placeholder={t(prompt)}
              onCameraClick={handleCameraClick}
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

        {/* Quote bar */}
        <div className="max-w-lg lg:max-w-2xl mx-auto px-5 mt-2 pb-14 lg:pb-16">
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

      {/* Mobile Joey strip — above bottom nav, never overlaps content */}
      <JoeyInvite onClick={() => setJoeyOpen(true)} lang={lang} />

      <BottomNav />

      {joeyOpen && (
        <JoeyChat
          currentEntry={currentEntryForJoey}
          lang={lang}
          onClose={() => setJoeyOpen(false)}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handlePhotoSelected}
        aria-hidden="true"
      />
    </div>
  )
}
