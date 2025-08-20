"use server"

import { getServerSupabase } from "@/lib/supabaseServer"

export async function isAdmin(): Promise<boolean> {
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const allow = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean)
  const email = (user.email || "").toLowerCase()
  return allow.map((s) => s.toLowerCase()).includes(email)
}
