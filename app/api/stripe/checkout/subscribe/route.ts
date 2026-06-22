import { getUserFromRequest, getAdminSupabase } from "@/lib/auth-server"
import { getStripe } from "@/lib/stripe"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getAdminSupabase()

  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle()

  if (
    existing?.status === "active" &&
    existing.current_period_end &&
    new Date(existing.current_period_end) > new Date()
  ) {
    return Response.json({ error: "Already subscribed" }, { status: 409 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_SUBSCRIPTION!, quantity: 1 }],
    metadata: { user_id: user.id },
    customer_email: user.email,
    success_url: `${appUrl}/?subscribed=true`,
    cancel_url: `${appUrl}/`,
    allow_promotion_codes: true,
  })

  return Response.json({ url: session.url })
}
