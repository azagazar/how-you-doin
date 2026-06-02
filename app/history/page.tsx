"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getEntries, getUserName } from "@/lib/storage"
import { JournalEntry } from "@/lib/types"
import { getCouchStory } from "@/lib/couchStories"
import { useI18n } from "@/lib/i18n"
import { BottomNav } from "@/components/BottomNav"
import { MiniCouch } from "@/components/MiniCouch"
import { EnergyBadge } from "@/components/EnergyBadge"

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

  useEffect(() => {
    if (!getUserName()) {
      router.replace("/onboarding")
      return
    }
    setEntries(getEntries())
  }, [router])

  return (
    <div className="min-h-dvh flex flex-col pb-24 bg-[#ece7df]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 pt-8 pb-6 space-y-6">

          {/* Header */}
          <div className="space-y-1">
            <h1 className="font-display text-5xl text-black uppercase leading-none">
              {t("history.title")}
            </h1>
            <p className="font-serif text-2xl text-black">
              {t("history.subtitle")}
            </p>
          </div>

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

                return (
                  <Link
                    key={entry.id}
                    href={`/entry/${entry.id}`}
                    className="block figma-card transition-all hover:opacity-90"
                  >
                    <div className="p-5 space-y-3">
                      {/* Date */}
                      <p className="font-display text-xl text-black uppercase leading-none">
                        {formatDate(entry.date, lang)}
                      </p>

                      {/* Mini couch with characters */}
                      <div className="flex justify-center">
                        <MiniCouch
                          primary={entry.primaryEnergy}
                          secondary={entry.secondaryEnergy}
                          width={200}
                        />
                      </div>

                      {/* Energy badges */}
                      {(entry.primaryEnergy || entry.secondaryEnergy) && (
                        <div className="flex gap-2 flex-wrap">
                          {entry.primaryEnergy && <EnergyBadge energy={entry.primaryEnergy} size="sm" />}
                          {entry.secondaryEnergy && <EnergyBadge energy={entry.secondaryEnergy} size="sm" />}
                        </div>
                      )}

                      {/* Day title */}
                      <p className="font-display text-xl text-black uppercase leading-tight">
                        {dayTitle}
                      </p>

                      {/* Note preview */}
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
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
