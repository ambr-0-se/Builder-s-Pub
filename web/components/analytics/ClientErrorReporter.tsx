"use client"

import { useEffect } from "react"
import { installGlobalClientErrorReporter } from "@/lib/utils/client-error"
import { useAnalytics } from "@/lib/analytics"

export function ClientErrorReporter() {
  const { track } = useAnalytics()

  useEffect(() => {
    let cleanup: (() => void) | undefined
    try {
      cleanup = installGlobalClientErrorReporter({ track })
    } catch {
      // ignore
    }
    return () => {
      try {
        cleanup?.()
      } catch {
        // ignore
      }
    }
  }, [track])

  return null
}


