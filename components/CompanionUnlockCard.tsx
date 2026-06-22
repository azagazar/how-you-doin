"use client"

import { useState } from "react"
import { COMPANIONS, CompanionId } from "@/lib/companions"
import { getAuthToken } from "@/lib/auth-client"
import { Lang } from "@/lib/i18n"

type Props = {
  companionId: CompanionId
  lang: Lang
  onBack: () => void
}

export function CompanionUnlockCard({ companionId, lang, onBack }: Props) {
  const companion = COMPANIONS[companionId]
  const [loading, setLoading] = useState<"subscribe" | "unlock" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe() {
    setLoading("subscribe")
    setError(null)
    try {
      const token = await getAuthToken()
      const res = await fetch("/api/stripe/checkout/subscribe", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Something went wrong")
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setLoading(null)
    }
  }

  async function handleUnlock() {
    setLoading("unlock")
    setError(null)
    try {
      const token = await getAuthToken()
      const res = await fetch("/api/stripe/checkout/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ companion_id: companionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Something went wrong")
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setLoading(null)
    }
  }

  const title = companion.unlockTitle[lang]
  const description = companion.unlockDescription[lang]
  const paragraphs = description.split("\n\n").filter(Boolean)

  return (
    <div className="flex flex-col h-full">
      {/* Back button */}
      <button
        onClick={onBack}
        className="self-start font-display text-xs uppercase text-[#6a4f79] hover:underline mb-4 tracking-wide"
      >
        ← Back
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/icons/${companionId}.png`}
          alt={companion.name}
          draggable={false}
          className="w-20 h-20 object-contain select-none"
        />

        <div className="space-y-3">
          <h2 className="font-display text-xl text-black uppercase leading-tight">
            {title}
          </h2>
          <div className="space-y-2 max-w-xs mx-auto">
            {paragraphs.map((p, i) => (
              <p key={i} className="font-serif text-base text-black/70 leading-snug">
                {p}
              </p>
            ))}
          </div>
        </div>

        <div className="w-full space-y-3 max-w-xs">
          {/* Subscribe option */}
          <div className="border-4 border-[#6a4f79] bg-[#fde52f] p-4 space-y-2">
            <p className="font-display text-sm uppercase text-[#6a4f79] tracking-wide">
              All companions · $10/month
            </p>
            <p className="font-serif text-xs text-black/70">
              Invite everyone to the couch. Cancel anytime.
            </p>
            <button
              onClick={handleSubscribe}
              disabled={loading !== null}
              className="w-full figma-btn disabled:opacity-60"
            >
              <span className="font-display text-[#fde52f] text-lg leading-none uppercase translate-y-[2px]">
                {loading === "subscribe" ? "..." : "Invite everyone — $10/mo"}
              </span>
            </button>
          </div>

          <p className="font-serif text-xs text-black/40">or</p>

          {/* Individual unlock */}
          <button
            onClick={handleUnlock}
            disabled={loading !== null}
            className="w-full figma-btn disabled:opacity-60"
          >
            <span className="font-display text-[#fde52f] text-lg leading-none uppercase translate-y-[2px]">
              {loading === "unlock" ? "..." : `Invite ${companion.name} — $20`}
            </span>
          </button>
        </div>

        {error && (
          <p className="font-serif text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  )
}
