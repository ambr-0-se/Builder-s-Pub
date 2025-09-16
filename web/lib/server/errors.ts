"use server"

import crypto from "node:crypto"
import { getServerSupabase } from "@/lib/supabaseServer"
import { checkRateLimit } from "@/lib/server/rate-limiting"

export type ReportInput = {
  message: string
  context?: unknown
  url?: string
  userMessage?: string
}

export type ReportOutput = { ok: true } | { error: "rate_limited" | "invalid_input"; retryAfterSec?: number }

export function anonymizeUserId(userId: string | null | undefined, salt = process.env.ERROR_SALT || ""): string | null {
  if (!userId) return null
  try {
    const hash = crypto.createHash("sha256")
    hash.update(String(salt))
    hash.update(":")
    hash.update(userId)
    return hash.digest("hex").slice(0, 16)
  } catch {
    return null
  }
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const URL_RE = /https?:\/\/[^\s)]+/gi

export function redactPII(value: unknown): unknown {
  try {
    if (value == null) return value
    if (typeof value === "string") return value.replace(EMAIL_RE, "[redacted-email]").replace(URL_RE, (m) => {
      try {
        const u = new URL(m)
        return `${u.protocol}//${u.host}/[redacted-path]`
      } catch {
        return "[redacted-url]"
      }
    })
    if (Array.isArray(value)) return value.map((v) => redactPII(v))
    if (typeof value === "object") {
      const result: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result[k] = redactPII(v)
      }
      return result
    }
    return value
  } catch {
    return "[redaction-error]"
  }
}

export async function handleReport(input: ReportInput, req: Request): Promise<ReportOutput> {
  if (!input || typeof input.message !== "string" || input.message.trim().length === 0) {
    return { error: "invalid_input" }
  }

  const supabase = await getServerSupabase()
  const { data: userData } = await supabase.auth.getUser()
  const rawUserId = userData?.user?.id ?? null
  const anonUserId = anonymizeUserId(rawUserId)

  // Rate limiting: use anon hash if available, else derive from IP (coarse fallback)
  const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown").split(",")[0].trim()
  const limiterUserKey = anonUserId || `ip:${ip}`
  const { limited, retryAfterSec } = await checkRateLimit(supabase, {
    action: "error_report",
    userId: limiterUserKey,
    limit: 10,
    windowSec: 60,
  })
  if (limited) return { error: "rate_limited", retryAfterSec }

  // Build sanitized payload
  const now = new Date().toISOString()
  const url = input.url || req.headers.get("referer") || ""
  const ua = req.headers.get("user-agent") || ""
  const payload = {
    ts: now,
    url,
    ua,
    user: anonUserId,
    message: redactPII(input.message),
    userMessage: redactPII(input.userMessage || ""),
    context: redactPII(input.context),
  }

  // For MVP, log to server stdout; future: send to provider
  try {
    // eslint-disable-next-line no-console
    console.log("[ErrorReport]", JSON.stringify(payload))
  } catch {
    // ignore
  }

  return { ok: true }
}


