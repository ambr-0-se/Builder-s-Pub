"use server"

import { cookies } from "next/headers"
import { getServerSupabase } from "@/lib/supabaseServer"

export async function isAdmin(): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean)
  if (adminEmails.length === 0) return false

  try {
    const supabase = await getServerSupabase()
    const { data } = await supabase.auth.getUser()
    const email = (data.user?.email || "").toLowerCase()
    if (!email) return false
    return adminEmails.map((s) => s.toLowerCase()).includes(email)
  } catch (_) {
    return false
  }
}
