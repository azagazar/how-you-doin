"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 bg-[#ece7df]">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

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

        {/* Card */}
        <div className="w-full figma-card px-6 py-8 flex flex-col items-center gap-5">
          <p className="font-serif text-xl text-black text-center">
            Sign in to keep your check-ins safe and in sync.
          </p>

          {error && (
            <p className="font-serif text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="figma-btn w-full disabled:opacity-60"
          >
            <span className="font-display text-[#fde52f] text-2xl leading-none uppercase translate-y-[2px]">
              {loading ? "Loading…" : "Sign in with Google"}
            </span>
          </button>
        </div>
      </div>
    </main>
  )
}
