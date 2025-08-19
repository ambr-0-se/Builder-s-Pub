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
    await supabase.auth.signOut()
  }, [])

  const profile: Profile | null = useMemo(() => {
    if (!sessionUser) return null
    // Map minimal fields to existing Profile shape until real profile table is wired in Stage 3
    const displayName = sessionUser.user_metadata?.full_name || sessionUser.email || "User"
    return {
      userId: sessionUser.id,
      displayName,
    }
  }, [sessionUser])

  return {
    isAuthenticated: !!sessionUser,
    user: profile,
    isLoading,
    signIn,
    signOut,
  }
}


