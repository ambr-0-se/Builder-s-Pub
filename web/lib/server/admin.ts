"use server"

import { cookies } from "next/headers"

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean)
  if (!supabaseUrl || adminEmails.length === 0) return false

  try {
    const projectRef = new URL(supabaseUrl).host.split(".")[0]
    const cookieName = `sb-${projectRef}-auth-token`
    const raw = cookieStore.get(cookieName)?.value
    if (!raw || raw.trim().length === 0) return false

    // Cookie value is a JSON string containing { access_token, refresh_token, ... }
    const parsed = JSON.parse(raw)
    const accessToken = parsed?.access_token as string | undefined
    if (!accessToken || typeof accessToken !== "string") return false

    const payloadSegment = accessToken.split(".")[1]
    if (!payloadSegment) return false
    const json = Buffer.from(payloadSegment.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    const claims = JSON.parse(json) as { email?: string }
    const email = (claims.email || "").toLowerCase()
    if (!email) return false
    return adminEmails.map((s) => s.toLowerCase()).includes(email)
  } catch (_) {
    // Any parsing/derivation failure → treat as non-admin without throwing/logging
    return false
  }
}
