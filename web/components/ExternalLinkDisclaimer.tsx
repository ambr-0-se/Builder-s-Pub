"use client"

import { useEffect, useState } from "react"
import { hasDisclaimerAck, isExternalUrl, setDisclaimerAck } from "@/lib/utils/external"

export function ExternalLinkDisclaimer() {
  const [show, setShow] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      try {
        const target = e.target as Element | null
        const a = target?.closest?.("a[href]") as HTMLAnchorElement | null
        if (!a) return
        if (!a.target || a.target.toLowerCase() !== "_blank") return
        const href = a.href
        if (!isExternalUrl(href)) return
        if (hasDisclaimerAck()) return
        e.preventDefault()
        setPendingHref(href)
        setShow(true)
      } catch {
        // ignore
      }
    }
    document.addEventListener("click", onClick, { capture: true })
    return () => document.removeEventListener("click", onClick, { capture: true } as any)
  }, [])

  function proceed(dontShowAgain: boolean) {
    try {
      if (dontShowAgain) setDisclaimerAck()
      if (pendingHref) window.open(pendingHref, "_blank", "noopener,noreferrer")
    } finally {
      setShow(false)
      setPendingHref(null)
    }
  }

  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-xl rounded-xl bg-white p-8 shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-900">You’re leaving Builder’s Pub</h2>
        <p className="mt-3 text-base text-gray-700">
          This link will open in a new tab to an <span className="font-semibold">external site</span>. Only proceed if you trust the destination.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Tip: Choose <span className="font-medium">Don’t show again</span> to skip this warning next time.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
            onClick={() => proceed(false)}
          >
            Proceed
          </button>
          <button
            className="inline-flex items-center rounded-md bg-gray-100 px-5 py-2.5 text-gray-800 hover:bg-gray-200"
            onClick={() => proceed(true)}
          >
            Don’t show again
          </button>
          <button
            className="ml-auto inline-flex items-center rounded-md bg-gray-100 px-5 py-2.5 text-gray-800 hover:bg-gray-200"
            onClick={() => {
              setShow(false)
              setPendingHref(null)
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}


