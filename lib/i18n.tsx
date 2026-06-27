"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import en from "../locales/en.json"
import pl from "../locales/pl.json"

export type Lang = "en" | "pl"

type NestedObject = { [key: string]: string | string[] | NestedObject }

type I18nContextType = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
  rawTranslations: { en: NestedObject; pl: NestedObject }
}

const I18nContext = createContext<I18nContextType | null>(null)

const LANG_KEY = "hyd_lang"

const STATIC_TRANSLATIONS = { en: en as NestedObject, pl: pl as NestedObject }

function lookup(obj: NestedObject, keys: string[]): string {
  let current: string | string[] | NestedObject = obj
  for (const key of keys) {
    if (Array.isArray(current)) {
      const idx = parseInt(key, 10)
      if (!isNaN(idx) && idx < current.length) {
        current = current[idx]
      } else {
        return keys.join(".")
      }
    } else if (current && typeof current === "object" && key in current) {
      current = (current as NestedObject)[key]
    } else {
      return keys.join(".")
    }
  }
  return typeof current === "string" ? current : keys.join(".")
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en")
  const [translations, setTranslations] = useState<{ en: NestedObject; pl: NestedObject }>(STATIC_TRANSLATIONS)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_KEY)
      if (stored === "en" || stored === "pl") setLangState(stored)
    } catch { /* localStorage unavailable (e.g. iOS private mode) */ }
  }, [])

  useEffect(() => {
    fetch("/api/cms/translations")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.en && data?.pl) {
          // Merge Strapi translations with static (Strapi wins, stories stay from static)
          setTranslations({
            en: { ...STATIC_TRANSLATIONS.en, ...data.en },
            pl: { ...STATIC_TRANSLATIONS.pl, ...data.pl },
          })
        }
      })
      .catch(() => { /* keep static fallback */ })
  }, [])

  const currentLocale = (lang === "pl" ? translations.pl : translations.en)

  const t = (key: string): string => lookup(currentLocale, key.split("."))

  const setLang = (l: Lang) => {
    setLangState(l)
    try {
      if (typeof window !== "undefined") localStorage.setItem(LANG_KEY, l)
    } catch { /* localStorage unavailable */ }
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t, rawTranslations: translations }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
