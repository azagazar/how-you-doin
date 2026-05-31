"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setUserName } from "@/lib/storage"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"

export default function OnboardingPage() {
  const [name, setName] = useState("")
  const router = useRouter()
  const { t } = useI18n()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setUserName(trimmed)
    router.push("/")
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-[#F5EFE6]">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/branding/friends-frame.png"
              alt="How You Doin'?"
              className="w-40 h-auto"
            />
          </div>
          <h1 className="font-display text-4xl font-bold text-[#2C1A0E]">How You Doin&apos;?</h1>
          <div className="text-[#6B5544] text-base leading-relaxed space-y-1">
            {t("onboarding.description").split("\n\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>

        <div className="w-full bg-[#EDE3D8] rounded-3xl p-6 space-y-5">
          <div className="text-center space-y-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/coffee.png" alt="" aria-hidden="true" className="w-10 h-10 object-contain mx-auto" />
            <p className="text-sm text-[#6B5544]">{t("onboarding.nameLabel")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("onboarding.namePlaceholder")}
                autoFocus
                className="w-full rounded-xl border-2 border-[#E8DDD0] bg-white/80 px-4 py-3 text-[#2C1A0E] placeholder:text-[#B0A090] focus:outline-none focus:border-[#6B4F7A] transition-colors text-base"
              />
            </div>
            <Button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-[#6B4F7A] hover:bg-[#5A3F68] text-white rounded-xl py-3 text-base font-semibold disabled:opacity-40"
            >
              {t("onboarding.submit")}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
