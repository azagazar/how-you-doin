"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import en from "../locales/en.json"
import pl from "../locales/pl.json"

export type Lang = "en" | "pl"

type I18nContextType = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

const LANG_KEY = "hyd_lang"

type NestedObject = { [key: string]: string | string[] | NestedObject }

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

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored === "en" || stored === "pl") setLangState(stored)
  }, [])

  const translations = (lang === "pl" ? pl : en) as NestedObject

  const t = (key: string): string => lookup(translations, key.split("."))

  const setLang = (l: Lang) => {
    setLangState(l)
    if (typeof window !== "undefined") localStorage.setItem(LANG_KEY, l)
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
