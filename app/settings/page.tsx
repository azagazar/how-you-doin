"use client"

import { useI18n } from "@/lib/i18n"
import { BottomNav } from "@/components/BottomNav"

export default function SettingsPage() {
  const { lang, setLang, t } = useI18n()

  return (
    <div className="min-h-dvh flex flex-col pb-24 bg-[#F5EFE6]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 pt-10 pb-6 space-y-8">
          <h1 className="font-display text-4xl font-bold text-[#2C1A0E]">{t("settings.title")}</h1>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#6B4F7A] uppercase tracking-wide">
              {t("settings.language")}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setLang("en")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
                style={{
                  background: lang === "en" ? "rgba(107,79,122,0.08)" : "#FBF5EC",
                  borderColor: lang === "en" ? "#6B4F7A" : "#D4C4B0",
                }}
              >
                <span className="text-xl">🇬🇧</span>
                <span className="font-medium text-[#2C1A0E]">English</span>
                {lang === "en" && (
                  <span className="ml-auto text-[#6B4F7A] text-sm font-bold">✓</span>
                )}
              </button>

              <button
                onClick={() => setLang("pl")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
                style={{
                  background: lang === "pl" ? "rgba(107,79,122,0.08)" : "#FBF5EC",
                  borderColor: lang === "pl" ? "#6B4F7A" : "#D4C4B0",
                }}
              >
                <span className="text-xl">🇵🇱</span>
                <span className="font-medium text-[#2C1A0E]">Polski</span>
                {lang === "pl" && (
                  <span className="ml-auto text-[#6B4F7A] text-sm font-bold">✓</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
