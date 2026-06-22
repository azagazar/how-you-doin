"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { isDemoMode, setDemoMode } from "@/lib/demo"
import { getAuthToken } from "@/lib/auth-client"
import { BottomNav } from "@/components/BottomNav"
import { DesktopNav } from "@/components/DesktopNav"
import type { User } from "@supabase/supabase-js"

type SubState = { active: true; renewsAt: string } | { active: false } | null

export default function SettingsPage() {
  const { lang, setLang, t } = useI18n()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [demo, setDemo] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [sub, setSub] = useState<SubState>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [subscribeLoading, setSubscribeLoading] = useState(false)

  useEffect(() => {
    setDemo(isDemoMode())
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchSub()
    })
  }, [])

  async function fetchSub() {
    const token = await getAuthToken()
    const r = await fetch("/api/companions/access", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!r.ok) return
    const data = await r.json()
    setSub(data.subscription ? { active: true, renewsAt: data.subscription.renewsAt } : { active: false })
  }

  async function handleManageSubscription() {
    setPortalLoading(true)
    const token = await getAuthToken()
    const r = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const data = await r.json()
    if (data.url) window.location.href = data.url
    else setPortalLoading(false)
  }

  async function handleSubscribe() {
    setSubscribeLoading(true)
    const token = await getAuthToken()
    const r = await fetch("/api/stripe/checkout/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
    const data = await r.json()
    if (data.url) window.location.href = data.url
    else setSubscribeLoading(false)
  }

  async function handleSignOut() {
    setSigningOut(true)
    setDemoMode(false)
    await supabase.auth.signOut()
    router.replace("/login")
  }

  async function handleGoogleSignIn() {
    setSigningIn(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const displayName = (user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "") as string
  const email = user?.email ?? ""

  return (
    <div className="h-dvh flex flex-col bg-[#ece7df]">
      <DesktopNav />
      <div className="flex-1 overflow-y-auto pb-24 lg:pb-6 page-enter">
        <div className="max-w-lg lg:max-w-2xl mx-auto px-5 pt-10 pb-6 space-y-8">
          <h1 className="font-display text-5xl text-black uppercase leading-none">{t("settings.title")}</h1>

          {/* Account status */}
          <div className="space-y-3">
            <p className="font-display text-xl text-[#6a4f79] uppercase">
              {t("settings.account")}
            </p>

            {user && !demo ? (
              /* Authenticated */
              <div
                className="w-full px-4 py-4 border"
                style={{ background: "#f7f3ec", borderColor: "#6a4f79", borderBottomWidth: 4 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#6a4f79] flex items-center justify-center flex-shrink-0">
                      <span className="font-display text-[#fde52f] text-lg leading-none">
                        {displayName.charAt(0).toUpperCase() || email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    {displayName && (
                      <p className="font-display text-base text-black uppercase leading-tight truncate">
                        {displayName}
                      </p>
                    )}
                    {email && (
                      <p className="font-serif text-sm text-black/60 leading-tight truncate">
                        {email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[#6a4f79] text-base leading-none">✓</span>
                    <p className="font-serif text-sm text-black/80">{t("settings.couchSaved")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#6a4f79] text-base leading-none">✓</span>
                    <p className="font-serif text-sm text-black/80">{t("settings.connectedGoogle")}</p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full figma-btn disabled:opacity-50"
                >
                  <span className="font-display text-[#fde52f] text-base leading-none uppercase translate-y-[2px]">
                    {signingOut ? "…" : t("settings.signOut")}
                  </span>
                </button>
              </div>
            ) : (
              /* Demo mode */
              <div
                className="w-full px-4 py-4 border"
                style={{ background: "#fde52f", borderColor: "#6a4f79", borderBottomWidth: 4 }}
              >
                <div className="mb-4">
                  <p className="font-display text-base text-black uppercase leading-tight mb-1">
                    {t("settings.demoMode")}
                  </p>
                  <p className="font-serif text-sm text-black/70 leading-snug">
                    {t("settings.demoNote")}
                  </p>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={signingIn}
                  className="w-full figma-btn disabled:opacity-50"
                >
                  <span className="font-display text-[#fde52f] text-base leading-none uppercase translate-y-[2px]">
                    {signingIn ? "…" : t("settings.continueGoogle")}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Subscription */}
          {user && !demo && (
            <div className="space-y-3">
              <p className="font-display text-xl text-[#6a4f79] uppercase">
                {t("settings.subscription")}
              </p>
              <div
                className="w-full px-4 py-4 border"
                style={{ background: "#f7f3ec", borderColor: "#6a4f79", borderBottomWidth: 4 }}
              >
                {sub === null ? (
                  <p className="font-serif text-sm text-black/50">…</p>
                ) : sub.active ? (
                  <>
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[#6a4f79] text-base leading-none">✓</span>
                        <p className="font-serif text-sm text-black/80">{t("settings.subscriptionActive")}</p>
                      </div>
                      <p className="font-serif text-xs text-black/50 pl-5">
                        {t("settings.subscriptionRenews")} {new Date(sub.renewsAt).toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <button
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                      className="w-full figma-btn disabled:opacity-50"
                    >
                      <span className="font-display text-[#fde52f] text-base leading-none uppercase translate-y-[2px]">
                        {portalLoading ? "…" : t("settings.manageSubscription")}
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-serif text-sm text-black/70 mb-4">{t("settings.noSubscription")}</p>
                    <button
                      onClick={handleSubscribe}
                      disabled={subscribeLoading}
                      className="w-full figma-btn disabled:opacity-50"
                    >
                      <span className="font-display text-[#fde52f] text-base leading-none uppercase translate-y-[2px]">
                        {subscribeLoading ? "…" : t("settings.subscribe")}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Language */}
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

          {/* Developer */}
          <div className="space-y-3">
            <p className="font-display text-xl text-[#6a4f79] uppercase">
              {t("settings.developer")}
            </p>
            <Link
              href="/docs"
              className="w-full flex items-center px-4 py-3 border transition-all hover:opacity-80"
              style={{ background: "#f7f3ec", borderColor: "#6a4f79", borderBottomWidth: 4 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📄</span>
                <span className="font-serif text-base text-black">{t("settings.apiDocs")}</span>
              </div>
            </Link>
          </div>

        </div>
      </div>
      <BottomNav />
    </div>
  )
}
