"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { setDemoMode } from "@/lib/demo"
import { SectionTag } from "@/components/SectionTag"
import { useI18n } from "@/lib/i18n"
import { ChemexLoaderScreen } from "@/components/ChemexLoader"
import posthog from "posthog-js"

export default function LoginPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    posthog.capture("login_started", { provider: "google" })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      posthog.captureException(error)
      setError(error.message)
      setLoading(false)
    }
  }

  async function handleDemoMode() {
    setLoading(true)
    posthog.capture("demo_mode_started")
    setDemoMode(true)
    await new Promise(r => setTimeout(r, 2000))
    router.push("/onboarding")
  }

  if (loading) return <ChemexLoaderScreen />

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 bg-[#ece7df]">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Couch */}
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/couch.png"
            alt="The couch"
            className="w-52 h-auto"
          />
        </div>

        {/* Title */}
        <h1 className="font-display text-6xl text-black text-center uppercase leading-none">
          How You Doin&apos;?
        </h1>

        {/* Subtitle */}
        <p className="font-serif text-xl text-black text-center">
          {t("login.subtitle")}
        </p>

        {/* Card */}
        <div className="w-full">
          <div className="flex justify-center relative z-10 -mb-5">
            <SectionTag label={t("login.sectionTag")} />
          </div>

          <div className="figma-card pt-7 pb-6 px-6 flex flex-col items-center gap-5">
            {/* Coffee icon */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/coffee.png"
              alt=""
              aria-hidden="true"
              className="w-10 h-10 object-contain"
            />

            <p className="font-serif text-xl text-black text-center">
              {t("login.description")}
            </p>

            {error && (
              <p className="font-serif text-sm text-red-500 text-center">{error}</p>
            )}

            {/* Google button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-stretch bg-[#6a4f79] disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ minHeight: 52 }}
            >
              {/* White icon box — left, in flow */}
              <span className="flex items-center justify-center bg-white flex-shrink-0" style={{ width: 52 }}>
                <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
              </span>
              {/* Text centered in the purple flex-1 area */}
              <span className="flex-1 flex items-center justify-center font-display text-[#fde52f] text-2xl leading-none uppercase translate-y-[2px]">
                {loading ? t("login.loading") : t("login.googleButton")}
              </span>
            </button>

            {/* OR divider */}
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-[#6a4f79] opacity-30" />
              <span className="font-display text-lg text-[#6a4f79] uppercase leading-none">{t("login.or")}</span>
              <div className="flex-1 h-px bg-[#6a4f79] opacity-30" />
            </div>

            {/* Demo button */}
            <button
              onClick={handleDemoMode}
              className="w-full flex items-center justify-center bg-[#6a4f79] hover:opacity-90 transition-opacity"
              style={{ minHeight: 52 }}
            >
              <span className="font-display text-[#fde52f] text-2xl leading-none uppercase translate-y-[2px]">
                {t("login.demoButton")}
              </span>
            </button>
          </div>
        </div>

        {/* Arrow + demo note combined */}
        <div className="w-full relative">
          {/* Arrow — top right, overlapping */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/arrow.png"
            alt=""
            aria-hidden="true"
            className="absolute z-10 pointer-events-none"
            style={{ width: 140, height: "auto", right: 8, top: -102 }}
          />
          {/* Demo note on brush background */}
          <div className="relative flex items-center justify-center w-full px-2" style={{ minHeight: 56 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/branding/demo-background.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-fill"
            />
            <p className="relative italic text-sm text-[#6a4f79] text-center" style={{ fontFamily: "var(--font-shadows)", padding: 20, fontSize: 22, color: "#000000" }}>
              {t("login.demoNote")}
            </p>
          </div>
        </div>

      </div>
    </main>
  )
}
