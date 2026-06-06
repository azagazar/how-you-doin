"use client"

import { useEffect, useRef } from "react"
import { JournalEntry } from "@/lib/types"

interface Props {
  entries: JournalEntry[]
  selectedId: string | null
  lang: string
  onSelect: (id: string) => void
}

function getDaysInCurrentMonth(): string[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    days.push(dateStr)
  }
  return days
}

function getMonthLabel(lang: string): string {
  return new Date()
    .toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", { month: "long", year: "numeric" })
    .toUpperCase()
}

export function DateNavigator({ entries, selectedId, lang, onSelect }: Props) {
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const entryByDate = new Map(entries.map((e) => [e.date, e]))
  const days = getDaysInCurrentMonth()
  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    if (!selectedId) return
    const el = chipRefs.current.get(selectedId)
    if (el) el.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
  }, [selectedId])

  useEffect(() => {
    if (selectedId) return
    chipRefs.current.get(today)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
  }, [])

  return (
    <div className="space-y-2">
      <p className="font-display text-xs uppercase" style={{ color: "#938d8d", letterSpacing: "0.08em" }}>
        {getMonthLabel(lang)}
      </p>
      <div
        role="group"
        aria-label="Browse journal entries by date"
        className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5"
        style={{ scrollbarWidth: "none" }}
      >
        {days.map((dateStr) => {
          const entry = entryByDate.get(dateStr)
          const isSelected = !!entry && entry.id === selectedId
          const hasEntry = !!entry
          const isToday = dateStr === today
          const isFuture = dateStr > today
          const isDisabled = !hasEntry

          const d = new Date(dateStr + "T12:00:00")
          const day = d.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", { day: "numeric" })
          const month = d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()
          const ariaLabel = d.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
            day: "numeric",
            month: "long",
          }) + (isToday ? " (today)" : "")

          // ── visual state resolution ──────────────────────────────
          let bg: string
          let borderColor: string
          let borderBottomWidth: number
          let textColor: string
          let chipOpacity: number

          if (isSelected) {
            // State 1 — selected
            bg = "#fde52f"
            borderColor = "#6a4f79"
            borderBottomWidth = 4
            textColor = "#6a4f79"
            chipOpacity = 1
          } else if (hasEntry) {
            // State 2 — has entry, not selected
            bg = "#f7f3ec"
            borderColor = "#6a4f79"
            borderBottomWidth = 4
            textColor = "#2c1a0e"
            chipOpacity = 1
          } else {
            // State 3 — no entry (past or future)
            bg = "#f0ede8"
            borderColor = "#d9d3cc"
            borderBottomWidth = 1
            textColor = "rgba(106, 79, 121, 0.35)"
            chipOpacity = isFuture ? 0.5 : 1
          }

          return (
            <button
              key={dateStr}
              ref={(el) => {
                if (el) chipRefs.current.set(entry?.id ?? dateStr, el)
                else chipRefs.current.delete(entry?.id ?? dateStr)
              }}
              onClick={() => entry && onSelect(entry.id)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              aria-label={ariaLabel}
              className="flex-none flex flex-col items-center justify-center font-display uppercase transition-opacity px-3"
              style={{
                background: bg,
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderBottomWidth,
                minWidth: 48,
                height: 60,
                opacity: chipOpacity,
                cursor: isDisabled ? "default" : "pointer",
                gap: 2,
              }}
            >
              {/* icon slot — reserved for future energy icon */}
              <span className="leading-none" style={{ fontSize: 20 }}>{day}</span>
              <span className="leading-none" style={{ fontSize: 10 }}>{month}</span>
              {/* State 4 — today dot (Monica blue, always visible) */}
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  backgroundColor: isToday ? "#6FB6D4" : "transparent",
                  marginTop: 1,
                  flexShrink: 0,
                }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
