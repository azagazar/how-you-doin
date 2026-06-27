import { createClient } from "@supabase/supabase-js"
import { getStripe } from "@/lib/stripe"
import { getPostHogClient } from "@/lib/posthog-server"
import type Stripe from "stripe"

export const runtime = "nodejs"

// Next.js must NOT parse the body — Stripe needs the raw bytes for signature verification
export const dynamic = "force-dynamic"

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = getAdminSupabase()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.payment_status !== "paid") break

      const userId = session.metadata?.user_id
      const companionId = session.metadata?.companion_id

      if (!userId) break

      const posthog = getPostHogClient()
      if (session.mode === "payment" && companionId) {
        // One-time unlock
        await supabase.from("companion_unlocks").upsert(
          {
            user_id: userId,
            companion_id: companionId,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string | null,
          },
          { onConflict: "user_id,companion_id", ignoreDuplicates: true }
        )
        posthog.capture({
          distinctId: userId,
          event: "companion_unlocked",
          properties: { companion: companionId, stripe_session_id: session.id },
        })
      } else if (session.mode === "subscription" && session.subscription) {
        // Subscription — fetch full subscription object for period end
        const stripe = getStripe()
        const sub = await stripe.subscriptions.retrieve(session.subscription as string, {
          expand: ["items"],
        })
        // current_period_end is on the subscription item in newer Stripe API versions
        const periodEnd =
          (sub as unknown as { current_period_end?: number }).current_period_end ??
          sub.items?.data?.[0]?.current_period_end ??
          Math.floor(Date.now() / 1000) + 30 * 24 * 3600
        await supabase.from("user_subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: sub.id,
            status: sub.status,
            current_period_end: new Date(periodEnd * 1000).toISOString(),
          },
          { onConflict: "user_id" }
        )
        posthog.capture({
          distinctId: userId,
          event: "subscription_completed",
          properties: {
            stripe_subscription_id: sub.id,
            stripe_customer_id: session.customer as string,
          },
        })
      }
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const periodEnd =
        (sub as unknown as { current_period_end?: number }).current_period_end ??
        sub.items?.data?.[0]?.current_period_end ??
        Math.floor(Date.now() / 1000) + 30 * 24 * 3600
      const canceledAt = (sub as unknown as { canceled_at: number | null }).canceled_at
      await supabase
        .from("user_subscriptions")
        .update({
          status: sub.status,
          current_period_end: new Date(periodEnd * 1000).toISOString(),
          canceled_at: canceledAt ? new Date(canceledAt * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", sub.id)
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const { data: subRow } = await supabase
        .from("user_subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", sub.id)
        .maybeSingle()
      await supabase
        .from("user_subscriptions")
        .update({
          status: "canceled",
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", sub.id)
      if (subRow?.user_id) {
        const posthog = getPostHogClient()
        posthog.capture({
          distinctId: subRow.user_id,
          event: "subscription_canceled",
          properties: { stripe_subscription_id: sub.id },
        })
      }
      break
    }
  }

  return Response.json({ received: true })
}
