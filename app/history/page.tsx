"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getEntries, getUserName } from "@/lib/storage"
import { supabase } from "@/lib/supabase"
import { isDemoMode } from "@/lib/demo"
import { JournalEntry } from "@/lib/types"
import { useCouchStoryResolver } from "@/lib/couchStories"
import { useI18n } from "@/lib/i18n"
import { BottomNav } from "@/components/BottomNav"
import { DesktopNav } from "@/components/DesktopNav"
import { EntryDetail } from "@/components/EntryDetail"
import { EnergyBadge } from "@/components/EnergyBadge"
import { DateNavigator } from "@/components/DateNavigator"
import { JoeyChat } from "@/components/JoeyChat"
import { JoeyButton } from "@/components/JoeyButton"
import { JoeyInvite } from "@/components/JoeyInvite"

function formatDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).toUpperCase()
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim()
}

export default function HistoryPage() {
  const router = useRouter()
  const { lang, t } = useI18n()
  const getCouchStory = useCouchStoryResolver()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [joeyOpen, setJoeyOpen] = useState(false)

  useEffect(() => {
    async function init() {
      if (!isDemoMode()) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.replace("/login")
          return
        }
      }
      if (!getUserName()) {
        router.replace("/onboarding")
        return
      }
      const loaded = await getEntries()
      setEntries(loaded)
      const entryParam = new URLSearchParams(window.location.search).get("entry")
      if (entryParam && loaded.some(e => e.id === entryParam)) {
        const entry = loaded.find(e => e.id === entryParam)!
        setSelectedId(entryParam)
        setSelectedDate(entry.date)
      } else if (loaded.length > 0 && window.innerWidth >= 1024) {
        setSelectedId(loaded[0].id)
        setSelectedDate(loaded[0].date)
      }
    }
    init()
  }, [router])

  function handleDayClick(dateStr: string) {
    setSelectedDate(dateStr)
    const entry = entries.find(e => e.date === dateStr)
    if (entry) {
      setSelectedId(entry.id)
      if (window.innerWidth < 1024) {
        router.push(`/entry/${entry.id}`)
      }
    } else {
      setSelectedId(null)
      // mobile: empty-day card shown inline — no navigation
    }
  }

  // entry card click (from list) still works
  function handleEntryClick(id: string) {
    const entry = entries.find(e => e.id === id)
    setSelectedId(id)
    setSelectedDate(entry?.date ?? null)
    if (window.innerWidth < 1024) {
      router.push(`/entry/${id}`)
    }
  }

  const emptyDaySelected = selectedDate && !selectedId
  const currentEntry = entries.find((e) => e.id === selectedId) ?? null

  return (
    <div className="h-dvh flex flex-col bg-[#ece7df]">
      <DesktopNav />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 page-enter">

        {/* Left panel — date navigator + entry list */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-6 lg:flex-none lg:w-80 lg:border-r lg:border-[#6a4f79]">
          <div className="px-5 pt-8 pb-6 space-y-4">

            <div className="space-y-3">
              <h1 className="font-display text-5xl text-black uppercase leading-none">
                {t("history.title")}
              </h1>
              <p className="font-serif text-black" style={{ fontSize: 18 }}>
                {t("history.subtitle")}
              </p>
            </div>

            <DateNavigator
              entries={entries}
              selectedDate={selectedDate}
              lang={lang}
              onSelectDay={handleDayClick}
            />

            {entries.length === 0 && !emptyDaySelected ? (
              <div className="text-center py-12 space-y-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/branding/couch.png"
                  alt=""
                  aria-hidden="true"
                  className="mx-auto"
                  style={{ width: 140, opacity: 0.45 }}
                  draggable={false}
                />
                <div className="space-y-1">
                  <p className="font-display text-2xl text-black uppercase">{t("history.emptyTitle")}</p>
                  <p className="font-serif text-base text-[#938d8d]">{t("history.emptySubtitle")}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">

                {/* Empty-day card — shown on mobile when a past day with no entry is selected */}
                {emptyDaySelected && (
                  <div className="figma-card p-5 space-y-3 animate-settle lg:hidden">
                    <p className="font-display text-xl text-black uppercase leading-none">
                      {formatDate(selectedDate, lang)}
                    </p>
                    <p className="font-serif text-base text-[#938d8d]">{t("history.emptyDay")}</p>
                  </div>
                )}

                {entries.map((entry) => {
                  const preview = stripHtml(entry.content)
                  const story = getCouchStory(entry.primaryEnergy, entry.secondaryEnergy)
                  const dayTitle = story.dayTitle
                  const isSelected = entry.id === selectedId

                  return (
                    <div
                      key={entry.id}
                      onClick={() => handleEntryClick(entry.id)}
                      className={`block figma-card transition-all hover:opacity-90 cursor-pointer ${isSelected ? "ring-2 ring-[#6a4f79] ring-offset-1" : ""}`}
                    >
                      <div className="p-5 space-y-3">
                        <p className="font-display text-xl text-black uppercase leading-none">
                          {formatDate(entry.date, lang)}
                        </p>

                        {(entry.primaryEnergy || entry.secondaryEnergy) && (
                          <div className="flex gap-2 flex-wrap">
                            {entry.primaryEnergy && <EnergyBadge energy={entry.primaryEnergy} size="sm" />}
                            {entry.secondaryEnergy && <EnergyBadge energy={entry.secondaryEnergy} size="sm" />}
                          </div>
                        )}

                        <p className="font-display text-xl text-black uppercase leading-tight">
                          {dayTitle}
                        </p>

                        {preview ? (
                          <p className="font-serif text-base text-black line-clamp-2 leading-relaxed">
                            {preview}
                          </p>
                        ) : (
                          <p className="font-serif text-base text-[#938d8d]">
                            {entry.primaryEnergy || entry.secondaryEnergy
                              ? t("history.noNote")
                              : t("history.couchWaiting")}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right panel — desktop only */}
        <div className="hidden lg:flex lg:flex-1 lg:overflow-y-auto">
          {selectedId ? (
            <EntryDetail
              id={selectedId}
              onDelete={async () => {
                setEntries(await getEntries())
                setSelectedId(null)
                setSelectedDate(null)
              }}
            />
          ) : emptyDaySelected ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center px-8">
              <p className="font-display text-2xl text-black uppercase opacity-60">
                {formatDate(selectedDate, lang)}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/branding/couch.png"
                alt=""
                aria-hidden="true"
                style={{ width: 140, opacity: 0.3 }}
                draggable={false}
              />
              <p className="font-display text-3xl text-black uppercase opacity-40">
                {t("history.couchWaiting")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/branding/couch.png"
                alt=""
                aria-hidden="true"
                style={{ width: 140, opacity: 0.3 }}
                draggable={false}
              />
              <p className="font-display text-3xl text-black uppercase opacity-40">
                {t("history.emptyTitle")}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Joey strip — above bottom nav */}
      <JoeyInvite onClick={() => setJoeyOpen(true)} lang={lang} />

      <BottomNav />

      {joeyOpen && (
        <JoeyChat
          currentEntry={currentEntry}
          lang={lang}
          onClose={() => setJoeyOpen(false)}
        />
      )}
    </div>
  )
}
