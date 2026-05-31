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
  })
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
    <div className="min-h-dvh flex flex-col pb-24 bg-[#F5EFE6]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 pt-10 pb-6 space-y-6">
          <div className="space-y-0.5">
            <h1 className="font-display text-4xl font-bold text-[#2C1A0E]">{t("history.title")}</h1>
            <p className="font-display italic text-xl text-[#6B5544]">{t("history.subtitle")}</p>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-12 space-y-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/branding/couch.png"
                alt=""
                aria-hidden="true"
                className="mx-auto"
                style={{ width: 140, opacity: 0.45, filter: "sepia(0.2)" }}
                draggable={false}
              />
              <div className="space-y-1">
                <p className="text-[#9B8878] font-medium">{t("history.emptyTitle")}</p>
                <p className="text-sm text-[#B0A090]">{t("history.emptySubtitle")}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => {
                const preview = stripHtml(entry.content)
                const story = getCouchStory(entry.primaryEnergy, entry.secondaryEnergy, lang)
                const dayTitle = story.dayTitle

                return (
                  <Link
                    key={entry.id}
                    href={`/entry/${entry.id}`}
                    className="block rounded-2xl p-4 transition-all hover:scale-[1.01]"
                    style={{
                      background: "#FBF5EC",
                      border: "1px solid #D4C4B0",
                      boxShadow: "0 4px 16px rgba(100,70,40,0.11), 0 1px 3px rgba(100,70,40,0.07)",
                    }}
                  >
                    <p className="text-[11px] font-semibold text-[#9B7B5B] uppercase tracking-wider mb-3">
                      {formatDate(entry.date, lang)}
                    </p>

                    <div className="flex justify-center mb-3">
                      <MiniCouch
                        primary={entry.primaryEnergy}
                        secondary={entry.secondaryEnergy}
                        width={148}
                      />
                    </div>

                    {(entry.primaryEnergy || entry.secondaryEnergy) && (
                      <div className="flex gap-2 flex-wrap mb-2">
                        {entry.primaryEnergy && <EnergyBadge energy={entry.primaryEnergy} size="sm" />}
                        {entry.secondaryEnergy && <EnergyBadge energy={entry.secondaryEnergy} size="sm" />}
                      </div>
                    )}

                    <p className="text-sm font-semibold text-[#2C1A0E] mb-2">{dayTitle}</p>

                    {preview ? (
                      <p className="text-sm text-[#6B5544] line-clamp-2 leading-relaxed font-display italic">
                        &ldquo;{preview}&rdquo;
                      </p>
                    ) : (
                      <p className="text-sm text-[#B0A090] italic">
                        {entry.primaryEnergy || entry.secondaryEnergy
                          ? t("history.noNote")
                          : t("history.couchWaiting")}
                      </p>
                    )}
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
