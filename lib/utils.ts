import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripHtml(html: string): string {
  return (html ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

export function formatEntryDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).toUpperCase()
}

export function formatEntryDateFull(dateStr: string, lang: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatDateBar(lang: string): string {
  const d = new Date()
  return d.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).toUpperCase()
}
