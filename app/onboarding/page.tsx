"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setUserName } from "@/lib/storage"
import { useI18n } from "@/lib/i18n"
import { SectionTag } from "@/components/SectionTag"
import posthog from "posthog-js"

export default function OnboardingPage() {
  const [name, setName] = useState("")
  const router = useRouter()
  const { t } = useI18n()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setUserName(trimmed)
    posthog.capture("onboarding_completed", { name: trimmed })
    router.push("/")
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 bg-[#ece7df]">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Couch image */}
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/couch.png"
            alt="The couch"
            className="w-52 h-auto"
          />
        </div>

        {/* Heading */}
        <h1 className="font-display text-6xl text-black text-center uppercase leading-none">
          {t("home.title")}
        </h1>

        {/* Subtitle */}
        <p className="font-serif text-xl text-black text-center">
          {t("onboarding.subtitle")}
        </p>

        {/* Card with section tag */}
        <div className="w-full">
          <div className="flex justify-center relative z-10 -mb-5">
            <SectionTag label={t("onboarding.sectionTag")} />
          </div>
          <div className="figma-card pt-7 pb-6 px-6 flex flex-col items-center gap-4">
            {/* Coffee icon */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/coffee.png"
              alt=""
              aria-hidden="true"
              className="w-10 h-10 object-contain"
            />

            {/* Who's joining */}
            <p className="font-serif text-xl text-black text-center">
              {t("onboarding.nameLabel")}
            </p>

            <form onSubmit={handleSubmit} autoComplete="off" className="w-full flex flex-col gap-4">
              {/* Name input */}
              <div className="border border-[#6a4f79] bg-[#faf8f4]">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("onboarding.namePlaceholder")}
                  autoComplete="off"
                  autoFocus
                  className="w-full px-4 py-3 bg-transparent font-serif text-lg text-black placeholder:text-[#938d8d] focus:outline-none"
                />
              </div>

              {/* Submit button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="figma-btn"
                >
                  <span className="font-display text-[#fde52f] text-2xl leading-none uppercase">
                    {t("onboarding.submit")}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
