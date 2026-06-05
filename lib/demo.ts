import { JournalEntry } from "./types"

const DEMO_KEY = "hyd_demo"
const DEMO_ENTRIES_KEY = "hyd_demo_entries"

// ─── Demo mode flag ───────────────────────────────────────────────────────────

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(DEMO_KEY) === "true"
}

export function setDemoMode(on: boolean): void {
  if (typeof window === "undefined") return
  if (on) {
    localStorage.setItem(DEMO_KEY, "true")
  } else {
    localStorage.removeItem(DEMO_KEY)
    localStorage.removeItem(DEMO_ENTRIES_KEY)
  }
}

// ─── Demo CRUD (localStorage only) ───────────────────────────────────────────

export function getDemoEntries(): JournalEntry[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(DEMO_ENTRIES_KEY) || "[]")
  } catch {
    return []
  }
}

export function saveDemoEntry(entry: JournalEntry): void {
  const entries = getDemoEntries()
  const idx = entries.findIndex((e) => e.id === entry.id)
  if (idx >= 0) {
    entries[idx] = entry
  } else {
    entries.unshift(entry)
  }
  localStorage.setItem(DEMO_ENTRIES_KEY, JSON.stringify(entries))
}

export function deleteDemoEntry(id: string): void {
  const entries = getDemoEntries().filter((e) => e.id !== id)
  localStorage.setItem(DEMO_ENTRIES_KEY, JSON.stringify(entries))
}
