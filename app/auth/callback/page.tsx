"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import posthog from "posthog-js"
import { supabase } from "@/lib/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Supabase JS v2 automatically detects ?code= in PKCE flow (detectSessionInUrl: true)
    // and exchanges it using the stored code_verifier from localStorage.
    // We just need to wait for the auth state to settle, then redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        posthog.identify(session.user.id, {
          email: session.user.email,
          name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name,
        })
        posthog.capture("user_signed_in", { provider: "google" })
        router.replace("/")
      }
    })

    // Also trigger getSession so Supabase processes the URL code immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/")
    })

    return () => subscription.unsubscribe()
  }, [router])

  return null
}
