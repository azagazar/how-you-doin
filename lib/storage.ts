import { JournalEntry } from "./types"

const ENTRIES_KEY = "hyd_entries"
const NAME_KEY = "hyd_name"

export function getUserName(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(NAME_KEY)
}

export function setUserName(name: string): void {
  localStorage.setItem(NAME_KEY, name)
}

export function getEntries(): JournalEntry[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(ENTRIES_KEY) || "[]")
  } catch {
    return []
  }
}

export function saveEntry(entry: JournalEntry): void {
  const entries = getEntries()
  const idx = entries.findIndex((e) => e.id === entry.id)
  if (idx >= 0) {
    entries[idx] = entry
  } else {
    entries.unshift(entry)
  }
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
}

export function deleteEntry(id: string): void {
  const entries = getEntries().filter((e) => e.id !== id)
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
}

export function getEntryByDate(date: string): JournalEntry | undefined {
  return getEntries().find((e) => e.date === date)
}

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]
}

export function getGreetingKey(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours()
  if (hour < 12) return "morning"
  if (hour < 18) return "afternoon"
  return "evening"
}
