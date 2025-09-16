"use client"

import Link from "next/link"
import React, { useEffect } from "react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Optionally log to an analytics pipeline in Step 2
    // console.warn("[App Error]", { message: error?.message, digest: error?.digest })
  }, [error])

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
      <p className="mt-2 text-gray-600">You can try again, go back, or report the problem so we can look into it.</p>
      <ul className="mt-3 text-sm text-gray-600 space-y-1">
        <li>• If you were signing in (401), please refresh and sign in again.</li>
        <li>• If you don’t have access (403), check that you are using the right account.</li>
        <li>• If you saw a conflict (409), try again after a few seconds.</li>
      </ul>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Try again
        </button>
        <button
          onClick={() => (typeof window !== "undefined" ? window.history.back() : null)}
          className="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
        >
          Go back
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
        >
          Home
        </Link>
        <Link
          href="/report-problem"
          className="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
        >
          Report a problem
        </Link>
      </div>
      {process.env.NODE_ENV !== "production" && error?.digest && (
        <p className="mt-4 text-xs text-gray-400">Ref: {error.digest}</p>
      )}
    </div>
  )
}


