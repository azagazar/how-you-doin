"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getEntries, getUserName } from "@/lib/storage"
import { supabase } from "@/lib/supabase"
import { isDemoMode } from "@/lib/demo"
import { getAuthToken } from "@/lib/auth-client"
import { CompanionId, COMPANIONS, COMPANION_ORDER } from "@/lib/companions"
import { JournalEntry } from "@/lib/types"
import { useI18n } from "@/lib/i18n"
import { BottomNav } from "@/components/BottomNav"
import { DesktopNav } from "@/components/DesktopNav"
import { SectionTag } from "@/components/SectionTag"

function getWeekStartDate(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  return monday.toISOString().split("T")[0]
}

function getCurrentYearMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

type EnergyCount = { id: CompanionId; name: string; count: number; pct: number }

function computeInsights(entries: JournalEntry[]) {
  const ym = getCurrentYearMonth()
  const monthEntries = entries.filter((e) => e.date.startsWith(ym))
  const totalEntries = monthEntries.length

  const counts: Record<CompanionId, number> = {
    joey: 0, monica: 0, chandler: 0, ross: 0, phoebe: 0, rachel: 0,
  }
  for (const e of monthEntries) {
    if (e.primaryEnergy) counts[e.primaryEnergy]++
    if (e.secondaryEnergy) counts[e.secondaryEnergy]++
  }

  const breakdown: EnergyCount[] = COMPANION_ORDER
    .filter((id) => counts[id] > 0)
    .map((id) => ({
      id,
      name: COMPANIONS[id].name,
      count: counts[id],
      pct: Math.round((counts[id] / totalEntries) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  const maxCount = breakdown[0]?.count ?? 0
  const topGuests = breakdown.filter((e) => e.count === maxCount)

  const photoEntries = monthEntries
    .filter((e) => e.photoUrl)
    .slice(0, 3)

  return { totalEntries, breakdown, topGuests, photoEntries, allPhotoCount: monthEntries.filter((e) => e.photoUrl).length }
}

export default function WeekPage() {
  const router = useRouter()
  const { t, lang } = useI18n()

  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [activeCompanion, setActiveCompanion] = useState<CompanionId>("joey")
  const [recap, setRecap] = useState<string | null>(null)
  const [recapLoading, setRecapLoading] = useState(false)
  const [recapError, setRecapError] = useState(false)
  const [tooFewEntries, setTooFewEntries] = useState(false)
  const [ready, setReady] = useState(false)

  // Auth + data load
  useEffect(() => {
    async function init() {
      if (!isDemoMode()) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.replace("/login"); return }
      }
      if (!getUserName()) { router.replace("/onboarding"); return }

      const loaded = await getEntries()
      setEntries(loaded)

      const stored = (() => {
        try { return localStorage.getItem("hyd_active_companion") as CompanionId | null } catch { return null }
      })()
      if (stored && COMPANIONS[stored]) setActiveCompanion(stored)

      setReady(true)
    }
    init()
  }, [router])

  // Fetch recap whenever companion or lang changes (after ready)
  useEffect(() => {
    if (!ready) return
    if (isDemoMode()) { setTooFewEntries(true); return }

    const cacheKey = `hyd_recap_${activeCompanion}_${getWeekStartDate()}_${lang}`
    const cached = (() => {
      try { return localStorage.getItem(cacheKey) } catch { return null }
    })()
    if (cached) {
      if (cached === "__TOO_FEW__") { setTooFewEntries(true); setRecap(null) }
      else { setRecap(cached); setTooFewEntries(false) }
      return
    }

    setRecapLoading(true)
    setRecap(null)
    setRecapError(false)
    setTooFewEntries(false)

    getAuthToken().then((token) =>
      fetch("/api/recap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ companionId: activeCompanion, lang }),
      })
    ).then((r) => r.json()).then((data) => {
      if (data.tooFewEntries) {
        setTooFewEntries(true)
        try { localStorage.setItem(cacheKey, "__TOO_FEW__") } catch { /* ok */ }
      } else if (data.recap) {
        setRecap(data.recap)
        try { localStorage.setItem(cacheKey, data.recap) } catch { /* ok */ }
      } else {
        setRecapError(true)
      }
    }).catch(() => setRecapError(true)).finally(() => setRecapLoading(false))
  }, [ready, activeCompanion, lang])

  const insights = computeInsights(entries)

  if (!ready) {
    return (
      <div className="h-dvh flex flex-col bg-[#ece7df]">
        <DesktopNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="joey-typing-dots">
            <span /><span /><span />
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  const companion = COMPANIONS[activeCompanion]

  return (
    <div className="h-dvh flex flex-col bg-[#ece7df]">
      <DesktopNav />
      <div className="flex-1 overflow-y-auto pb-24 lg:pb-6 page-enter">
        <div className="max-w-lg lg:max-w-2xl mx-auto px-5 pt-8 pb-6 space-y-6">

          {/* Title */}
          <h1 className="font-display text-5xl text-black uppercase leading-none">
            {t("week.title")}
          </h1>

          {/* ── Recap Section ─────────────────────────────────────────── */}
          <div className="space-y-3">
            <SectionTag label={t("week.recapSection")} />

            <div className="figma-card p-5 space-y-4">
              {/* Companion header */}
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/icons/${activeCompanion}.png`}
                  alt={companion.name}
                  className="flex-shrink-0"
                  style={{ width: 44, height: 44, objectFit: "contain" }}
                />
                <span className="font-display text-xl text-[#6a4f79] uppercase leading-none">
                  {companion.name}
                </span>
              </div>

              {/* Recap body */}
              {recapLoading ? (
                <div className="py-2">
                  <div className="joey-typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              ) : tooFewEntries ? (
                <div className="space-y-1">
                  <p className="font-serif text-base text-black leading-relaxed">
                    {t("week.emptyCouch")}
                  </p>
                  <p className="font-serif text-sm text-[#938d8d]">
                    {t("week.emptyNote")}
                  </p>
                </div>
              ) : recapError ? (
                <p className="font-serif text-sm text-[#938d8d]">
                  {t("week.recapError")}
                </p>
              ) : recap ? (
                <p className="font-serif text-base text-black leading-relaxed whitespace-pre-line">
                  {recap}
                </p>
              ) : null}
            </div>
          </div>

          {/* ── Insights Section ──────────────────────────────────────── */}
          {insights.totalEntries > 0 && (
            <div className="space-y-4">
              <SectionTag label={t("week.insightsSection")} />

              {/* Most frequent guest */}
              {insights.topGuests.length > 0 && (
                <div className="figma-card p-5 space-y-3">
                  <p className="font-display text-sm text-[#6a4f79] uppercase leading-none tracking-wide">
                    {t("week.mostTimeOnCouch")}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {insights.topGuests.map((g) => (
                      <div key={g.id} className="flex flex-col items-center gap-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/icons/${g.id}.png`}
                          alt={g.name}
                          style={{ width: 40, height: 40, objectFit: "contain" }}
                        />
                        <p className="font-display text-xl text-black uppercase leading-tight">
                          {g.name}
                        </p>
                        <p className="font-serif text-sm text-[#938d8d] leading-tight text-center">
                          {g.pct}% {t("week.ofYourEntries")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Energy breakdown */}
              {insights.breakdown.length > 0 && (
                <div className="figma-card p-5 space-y-3">
                  <p className="font-display text-sm text-[#6a4f79] uppercase leading-none tracking-wide">
                    {t("week.thisMonthsCouch")}
                  </p>
                  <div className="space-y-2">
                    {insights.breakdown.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/icons/${item.id}.png`}
                          alt={item.name}
                          className="flex-shrink-0"
                          style={{ width: 28, height: 28, objectFit: "contain" }}
                        />
                        <span className="font-display text-sm text-black uppercase w-20 flex-shrink-0">
                          {item.name}
                        </span>
                        <div className="flex-1 h-2 rounded-none overflow-hidden" style={{ background: "#e4ddd5" }}>
                          <div
                            className="h-full"
                            style={{ width: `${item.pct}%`, background: "#6a4f79" }}
                          />
                        </div>
                        <span className="font-display text-sm text-[#6a4f79] w-10 text-right flex-shrink-0">
                          {item.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Days on the couch */}
              <p className="font-serif text-base text-black px-1">
                {insights.totalEntries} {t("week.daysOnCouch")}
              </p>

              {/* Snapshot memories */}
              {insights.photoEntries.length > 0 && (
                <div className="figma-card p-5 space-y-3">
                  <p className="font-display text-sm text-[#6a4f79] uppercase leading-none tracking-wide">
                    {t("week.snapshotMemories")}
                  </p>
                  <div className="flex gap-2">
                    {insights.photoEntries.map((e) => (
                      <Link
                        key={e.id}
                        href={`/history?entry=${e.id}`}
                        className="flex-shrink-0 overflow-hidden border border-[#6a4f79]"
                        style={{ width: 64, height: 64 }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={e.photoUrl}
                          alt={e.date}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    ))}
                  </div>
                  <p className="font-serif text-sm text-[#938d8d]">
                    {insights.allPhotoCount} {t("week.photosThisMonth")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No entries at all */}
          {insights.totalEntries === 0 && (
            <div className="text-center py-12 space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/branding/couch.png"
                alt=""
                aria-hidden="true"
                className="mx-auto"
                style={{ width: 140, opacity: 0.4 }}
                draggable={false}
              />
              <div className="space-y-1">
                <p className="font-display text-2xl text-black uppercase">{t("week.noEntriesYet")}</p>
                <p className="font-serif text-base text-[#938d8d]">{t("week.noEntriesNote")}</p>
              </div>
            </div>
          )}

        </div>
      </div>
      <BottomNav />
    </div>
  )
}
