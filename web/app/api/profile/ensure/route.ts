import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const res = NextResponse.json({ ok: true })

  // Build a route-scoped client that can SET cookies on the response
  const isHttps = (req.headers.get("x-forwarded-proto") || "http") === "https"
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const value = cookieStore.get(name)?.value
        return typeof value === "string" && value.trim().length === 0 ? undefined as unknown as string : value
      },
      set(name: string, value: string, options: any) {
        res.cookies.set({ name, value, ...options, secure: isHttps, sameSite: "lax", path: "/" })
      },
      remove(name: string, options: any) {
        res.cookies.set({ name, value: "", ...options, maxAge: 0, secure: isHttps, sameSite: "lax", path: "/" })
      },
    },
  })

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

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const defaultDisplay = user.email || "User"

  // If a profile already exists, do NOT overwrite user's chosen display_name
  const existing = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!existing.data) {
    const { error } = await supabase
      .from("profiles")
      .insert({ user_id: user.id, display_name: defaultDisplay })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return res
}


