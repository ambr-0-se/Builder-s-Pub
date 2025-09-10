"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    __POSTHOG_INIT__?: boolean
  }
}

// We initialize PostHog on the client if a key is provided. When not configured,
// this component is a safe no-op to avoid runtime errors in local/dev.
export function AnalyticsProvider() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com"

    let cancelled = false

    // Lazy-load the SDK to avoid adding it to the critical path
    import("posthog-js").then(({ default: posthog }) => {
      if (cancelled) return
      try {
        // Avoid double-initialization in Fast Refresh
        if (typeof window !== "undefined" && window.__POSTHOG_INIT__) return
        posthog.init(key, {
          api_host: host,
          capture_pageview: false,
          autocapture: true,
        })
        if (typeof window !== "undefined") window.__POSTHOG_INIT__ = true
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[Analytics] init failed", err)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return null
}


