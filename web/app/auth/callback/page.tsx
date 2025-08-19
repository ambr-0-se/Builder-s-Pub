"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

// Note: client components cannot export metadata

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const currentUrl = new URL(window.location.href)
      const search = currentUrl.searchParams
      const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ""))

      let error: unknown = null
      try {
        if (search.get("code")) {
          // OAuth / PKCE flow
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(window.location.href)
          if (exErr) error = exErr
        } else if (hashParams.get("access_token") && hashParams.get("refresh_token")) {
          // Magic link flow returns tokens in the URL hash
          const access_token = hashParams.get("access_token") as string
          const refresh_token = hashParams.get("refresh_token") as string
          const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token })
          if (setErr) error = setErr
        } else {
          // Fallback: try older helper if available at runtime
          const anyAuth: any = (supabase as any).auth
          if (typeof anyAuth.getSessionFromUrl === "function") {
            const { error: urlErr } = await anyAuth.getSessionFromUrl({ storeSession: true })
            if (urlErr) error = urlErr
          } else {
            error = new Error("Missing auth params in callback URL")
          }
        }
      } catch (e) {
        error = e
      }

      if (!error) {
        try {
          // Prefer session tokens from the client after exchange; covers PKCE flow without hash tokens
          const { data } = await supabase.auth.getSession()
          const tokens = data.session
            ? { access_token: data.session.access_token, refresh_token: data.session.refresh_token }
            : hashParams.get("access_token") && hashParams.get("refresh_token")
              ? {
                  access_token: hashParams.get("access_token") as string,
                  refresh_token: hashParams.get("refresh_token") as string,
                }
              : undefined
          await fetch("/api/profile/ensure", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            cache: "no-store",
            body: tokens ? JSON.stringify(tokens) : undefined,
          })
        } catch (_) {
          // Non-blocking
        }
      } else {
        // eslint-disable-next-line no-alert
        window.alert("Authentication failed. Please try again.")
      }
      const redirect = new URL(window.location.href).searchParams.get("redirectTo") || "/"
      window.location.replace(redirect)
    }

    handleCallback()
  }, [router])

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Completing Sign In</h1>
      <p className="text-gray-600">Please wait while we complete your authentication...</p>
    </div>
  )
}
