"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getEntries, getUserName } from "@/lib/storage"
import { supabase } from "@/lib/supabase"
import { isDemoMode } from "@/lib/demo"
import { JournalEntry } from "@/lib/types"
import { getCouchStory } from "@/lib/couchStories"
import { useI18n } from "@/lib/i18n"
import { BottomNav } from "@/components/BottomNav"
import { DesktopNav } from "@/components/DesktopNav"
import { EntryDetail } from "@/components/EntryDetail"
import { EnergyBadge } from "@/components/EnergyBadge"
import { DateNavigator } from "@/components/DateNavigator"

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
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session && !isDemoMode()) {
        router.replace("/login")
        return
      }
      if (!getUserName()) {
        router.replace("/onboarding")
        return
      }
      const loaded = await getEntries()
      setEntries(loaded)
      const entryParam = new URLSearchParams(window.location.search).get("entry")
      if (entryParam && loaded.some(e => e.id === entryParam)) {
        setSelectedId(entryParam)
      } else if (loaded.length > 0 && window.innerWidth >= 1024) {
        setSelectedId(loaded[0].id)
      }
    }
    init()
  }, [router])

  function handleEntryClick(id: string) {
    setSelectedId(id)
    if (window.innerWidth < 1024) {
      router.push(`/entry/${id}`)
    }
  }

  return (
    <div className="h-dvh flex flex-col bg-[#ece7df]">
      <DesktopNav />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">

        {/* Left panel — entry list */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-6 lg:flex-none lg:w-80 lg:border-r lg:border-[#6a4f79]">
          <div className="px-5 pt-8 pb-6 space-y-4">

            <div className="space-y-1">
              <h1 className="font-display text-5xl text-black uppercase leading-none">
                {t("history.title")}
              </h1>
              <p className="font-serif text-black" style={{ fontSize: 18 }}>
                {t("history.subtitle")}
              </p>
            </div>

            {entries.length > 0 && (
              <DateNavigator
                entries={entries}
                selectedId={selectedId}
                lang={lang}
                onSelect={handleEntryClick}
              />
            )}

            {entries.length === 0 ? (
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
                {entries.map((entry) => {
                  const preview = stripHtml(entry.content)
                  const story = getCouchStory(entry.primaryEnergy, entry.secondaryEnergy, lang)
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
              }}
            />
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

      <BottomNav />
    </div>
  )
}
