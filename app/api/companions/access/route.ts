import { getUserFromRequest, getAdminSupabase } from "@/lib/auth-server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getAdminSupabase()

  const [{ data: sub }, { data: unlocks }] = await Promise.all([
    supabase
      .from("user_subscriptions")
      .select("status, current_period_end, stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("companion_unlocks")
      .select("companion_id")
      .eq("user_id", user.id),
  ])

  const hasActiveSub =
    sub?.status === "active" &&
    sub.current_period_end &&
    new Date(sub.current_period_end) > new Date()

  return Response.json({
    subscription: hasActiveSub
      ? { active: true, renewsAt: sub!.current_period_end, subscriptionId: sub!.stripe_subscription_id }
      : null,
    individualUnlocks: (unlocks ?? []).map((r) => r.companion_id as string),
  })
}
