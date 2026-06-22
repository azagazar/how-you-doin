import { SupabaseClient } from "@supabase/supabase-js"
import { CompanionId, COMPANIONS } from "./companions"

export async function hasCompanionAccess(
  userId: string,
  companionId: CompanionId,
  supabase: SupabaseClient
): Promise<boolean> {
  if (COMPANIONS[companionId].free) return true

  // Check active subscription
  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle()

  if (
    sub?.status === "active" &&
    sub.current_period_end &&
    new Date(sub.current_period_end) > new Date()
  ) {
    return true
  }

  // Check individual unlock
  const { data: unlock } = await supabase
    .from("companion_unlocks")
    .select("id")
    .eq("user_id", userId)
    .eq("companion_id", companionId)
    .maybeSingle()

  return unlock !== null
}
