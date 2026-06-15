import { JournalEntry } from "./types"
import { supabase } from "./supabase"
import { isDemoMode, getDemoEntries, saveDemoEntry, deleteDemoEntry } from "./demo"

const NAME_KEY = "hyd_name"

// ─── User name (stays in localStorage) ──────────────────────────────────────

export function getUserName(): string | null {
  if (typeof window === "undefined") return null
  try { return localStorage.getItem(NAME_KEY) } catch { return null }
}

export function setUserName(name: string): void {
  try { localStorage.setItem(NAME_KEY, name) } catch { /* unavailable */ }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type DbRow = {
  id: string
  user_id: string
  date: string
  primary_energy: string | null
  secondary_energy: string | null
  content: string
  created_at: string
  photo_url: string | null
}

function toEntry(row: DbRow): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    primaryEnergy: (row.primary_energy as JournalEntry["primaryEnergy"]) ?? undefined,
    secondaryEnergy: (row.secondary_energy as JournalEntry["secondaryEnergy"]) ?? undefined,
    content: row.content,
    createdAt: row.created_at,
    photoUrl: row.photo_url ?? undefined,
  }
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function getEntries(): Promise<JournalEntry[]> {
  if (isDemoMode()) return getDemoEntries()

  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .order("date", { ascending: false })

  if (error) {
    console.error("getEntries error:", error)
    return []
  }
  return (data as DbRow[]).map(toEntry)
}

export async function saveEntry(entry: JournalEntry): Promise<void> {
  if (isDemoMode()) { saveDemoEntry(entry); return }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase
    .from("journal_entries")
    .upsert({
      id: entry.id,
      user_id: user.id,
      date: entry.date,
      primary_energy: entry.primaryEnergy ?? null,
      secondary_energy: entry.secondaryEnergy ?? null,
      content: entry.content,
      created_at: entry.createdAt,
    })

  if (error) throw error
}

export async function deleteEntry(id: string): Promise<void> {
  if (isDemoMode()) { deleteDemoEntry(id); return }

  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function getEntryByDate(date: string): Promise<JournalEntry | undefined> {
  if (isDemoMode()) return getDemoEntries().find((e) => e.date === date)

  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("date", date)
    .maybeSingle()

  if (error) {
    console.error("getEntryByDate error:", error)
    return undefined
  }
  return data ? toEntry(data as DbRow) : undefined
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]
}

export function getGreetingKey(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours()
  if (hour < 12) return "morning"
  if (hour < 18) return "afternoon"
  return "evening"
}
