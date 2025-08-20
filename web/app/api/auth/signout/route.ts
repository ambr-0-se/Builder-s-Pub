import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const res = NextResponse.json({ ok: true })

  const isHttps = (req.headers.get("x-forwarded-proto") || "http") === "https"
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        res.cookies.set({ name, value, ...options, secure: isHttps, sameSite: "lax", path: "/" })
      },
      remove(name: string, options: any) {
        res.cookies.set({ name, value: "", ...options, maxAge: 0, secure: isHttps, sameSite: "lax", path: "/" })
      },
    },
  })

  await supabase.auth.signOut()
  return res
}


