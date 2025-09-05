"use server"

import type { getServerSupabase } from "@/lib/supabaseServer"

export interface RateLimitParams {
  action: string
  userId: string
  limit: number
  windowSec: number
}

export type RateLimitResult = { limited: boolean; retryAfterSec?: number }

// Centralized per-user rate limiting using the `rate_limits` table.
// Uses fixed-size time windows derived from `windowSec`.
export async function checkRateLimit(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  { action, userId, limit, windowSec }: RateLimitParams
): Promise<RateLimitResult> {
  const nowMs = Date.now()
  const windowMs = windowSec * 1000
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs
  const windowStartIso = new Date(windowStartMs).toISOString()

  // Read current count for this window (fail-open if table or methods are unavailable)
  try {
    const fromFn = (supabase as any)?.from
    const table = typeof fromFn === "function" ? fromFn.call(supabase, "rate_limits") : null
    const selectFn = table && typeof table.select === "function" ? table.select : null
    if (!selectFn) return { limited: false }

    const { data: existing, error: selErr } = await selectFn.call(table, "count")
      .eq("action", action)
      .eq("user_id", userId)
      .eq("window_start", windowStartIso)
      .maybeSingle()

    if (selErr) return { limited: false }

    const current = existing?.count ? Number(existing.count) : 0
    if (current >= limit) {
      const retryAfterSec = Math.ceil((windowStartMs + windowMs - nowMs) / 1000)
      return { limited: true, retryAfterSec }
    }

    // Increment count via upsert
    const nextCount = current + 1
    await (supabase as any)
      .from("rate_limits")
      .upsert(
        { action, user_id: userId, window_start: windowStartIso, count: nextCount },
        { onConflict: "action,user_id,window_start" }
      )

    return { limited: false }
  } catch {
    // Any unexpected error: fail open
    return { limited: false }
  }
}


