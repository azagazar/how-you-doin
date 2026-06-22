import { getUserFromRequest, getAdminSupabase } from "@/lib/auth-server"
import { getStripe } from "@/lib/stripe"
import { COMPANIONS, CompanionId } from "@/lib/companions"
import { hasCompanionAccess } from "@/lib/companion-access"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { companion_id } = await req.json() as { companion_id: CompanionId }
  const companion = COMPANIONS[companion_id]

  if (!companion) return Response.json({ error: "Invalid companion" }, { status: 400 })
  if (companion.free) return Response.json({ error: "Companion is free" }, { status: 400 })
  if (!companion.priceId) return Response.json({ error: "No price configured" }, { status: 400 })

  const supabase = getAdminSupabase()
  const alreadyUnlocked = await hasCompanionAccess(user.id, companion_id, supabase)
  if (alreadyUnlocked) {
    return Response.json({ error: "Already unlocked" }, { status: 409 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: companion.priceId, quantity: 1 }],
    metadata: { user_id: user.id, companion_id },
    customer_email: user.email,
    success_url: `${appUrl}/?unlocked=${companion_id}`,
    cancel_url: `${appUrl}/`,
  })

  return Response.json({ url: session.url })
}
