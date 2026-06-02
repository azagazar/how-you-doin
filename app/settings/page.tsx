"use client"

import { useI18n } from "@/lib/i18n"
import { BottomNav } from "@/components/BottomNav"

export default function SettingsPage() {
  const { lang, setLang, t } = useI18n()

  return (
    <div className="min-h-dvh flex flex-col pb-24 bg-[#ece7df]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 pt-10 pb-6 space-y-8">
          <h1 className="font-display text-5xl text-black uppercase leading-none">{t("settings.title")}</h1>

          <div className="space-y-3">
            <p className="font-display text-xl text-[#6a4f79] uppercase">
              {t("settings.language")}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setLang("en")}
                className="w-full flex items-center gap-3 px-4 py-3 border transition-all"
                style={{
                  background: lang === "en" ? "#fde52f" : "#f7f3ec",
                  borderColor: "#6a4f79",
                  borderBottomWidth: lang === "en" ? 4 : 1,
                }}
              >
                <span className="text-xl">🇬🇧</span>
                <span className="font-serif text-base text-black">English</span>
                {lang === "en" && (
                  <span className="ml-auto font-display text-xl text-[#6a4f79]">✓</span>
                )}
              </button>

              <button
                onClick={() => setLang("pl")}
                className="w-full flex items-center gap-3 px-4 py-3 border transition-all"
                style={{
                  background: lang === "pl" ? "#fde52f" : "#f7f3ec",
                  borderColor: "#6a4f79",
                  borderBottomWidth: lang === "pl" ? 4 : 1,
                }}
              >
                <span className="text-xl">🇵🇱</span>
                <span className="font-serif text-base text-black">Polski</span>
                {lang === "pl" && (
                  <span className="ml-auto font-display text-xl text-[#6a4f79]">✓</span>
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
