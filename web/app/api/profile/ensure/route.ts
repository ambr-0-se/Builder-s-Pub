import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabaseServer"

export async function POST(req: Request) {
  const supabase = await getServerSupabase()

  // Try to get user from existing cookies first
  let {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user cookie yet, accept tokens from body to set the server session cookie once
  if (!user) {
    try {
      const { access_token, refresh_token } = await req.json()
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token })
        const result = await supabase.auth.getUser()
        user = result.data.user
      }
    } catch (_) {
      // ignore body parse errors
    }
  }

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const defaultDisplay = user.email || "User"

  const { error } = await supabase
    .from("profiles")
    .upsert(
      { user_id: user.id, display_name: defaultDisplay },
      { onConflict: "user_id" }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}


