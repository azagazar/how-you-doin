import { getUserFromRequest, getAdminSupabase } from "@/lib/auth-server"
import { getStripe } from "@/lib/stripe"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getAdminSupabase()
  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return Response.json({ error: "No subscription found" }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  try {
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${appUrl}/settings`,
    })
    return Response.json({ url: portalSession.url })
  } catch {
    return Response.json({ error: "Failed to open billing portal" }, { status: 502 })
  }
}
