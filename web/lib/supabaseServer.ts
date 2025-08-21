"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function getServerSupabase() {
  const cookieStore = await cookies()

  if (!supabaseUrl || !supabaseAnonKey) {
    // Keep non-fatal to allow build without env vars; runtime routes will still warn/fail if used
    // eslint-disable-next-line no-console
    console.warn(
      "Supabase env vars are missing on the server. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    )
  }

  return createServerClient(supabaseUrl || "", supabaseAnonKey || "", {
    cookies: {
      get(name: string) {
        const value = cookieStore.get(name)?.value
        // Return undefined for blank values to avoid JSON.parse errors inside @supabase/ssr
        // when cookies have been cleared (empty string) but still present on the request.
        if (typeof value === "string" && value.trim().length === 0) {
          return undefined as unknown as string
        }
        return value
      },
      set(name: string, value: string, options: any) {
        try {
          ;(cookieStore as any).set({ name, value, ...options })
        } catch (_) {
          // ignore in non-mutable contexts
        }
      },
      remove(name: string, options: any) {
        try {
          ;(cookieStore as any).set({ name, value: "", ...options, maxAge: 0 })
        } catch (_) {
          // ignore in non-mutable contexts
        }
      },
    },
  })
}


