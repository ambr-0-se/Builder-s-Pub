"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type { Profile } from "@/lib/types"

interface AuthState {
  isAuthenticated: boolean
  user: Profile | null
  isLoading: boolean
  signIn: (email?: string, options?: { redirectTo?: string }) => Promise<void>
  signOut: () => Promise<void>
}

export function useAuth(): AuthState {
  const [sessionUser, setSessionUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (isMounted) {
        setSessionUser(data.session?.user ?? null)
        setIsLoading(false)
      }
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setSessionUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email?: unknown, options?: { redirectTo?: string }) => {
    // If a React event was passed (e.g., onClick={signIn}), ignore it
    const normalizedEmail = typeof email === "string" ? email : undefined
    // Basic UX: if no email provided, prompt via window.prompt for now
    const targetEmail =
      normalizedEmail || (typeof window !== "undefined" ? window.prompt("Enter your email to sign in:") || "" : "")
    if (!targetEmail) return

    const base = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined
    const emailRedirectTo = options?.redirectTo && base
      ? `${base}?redirectTo=${encodeURIComponent(options.redirectTo)}`
      : base

    await supabase.auth.signInWithOtp({ email: targetEmail, options: { emailRedirectTo } })
  }, [])

  const signOut = useCallback(async () => {
    // Sign out on client to clear local session
    await supabase.auth.signOut()
    // Also clear httpOnly server cookies via API to keep SSR in sync
    try {
      await fetch("/api/auth/signout", { method: "POST", credentials: "include" })
    } catch (_) {
      // non-blocking
    }
  }, [])

  const [dbProfile, setDbProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let aborted = false
    const load = async () => {
      if (!sessionUser) {
        setDbProfile(null)
        return
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .eq("user_id", sessionUser.id)
        .maybeSingle()
      if (aborted) return
      if (!error && data) {
        setDbProfile({ userId: data.user_id as string, displayName: (data as any).display_name as string })
      } else {
        const displayName = sessionUser.user_metadata?.full_name || sessionUser.email || "User"
        setDbProfile({ userId: sessionUser.id, displayName })
      }
    }
    load()
    return () => {
      aborted = true
    }
  }, [sessionUser])

  const profile: Profile | null = useMemo(() => {
    return sessionUser ? dbProfile : null
  }, [sessionUser, dbProfile])

  return {
    isAuthenticated: !!sessionUser,
    user: profile,
    isLoading,
    signIn,
    signOut,
  }
}


