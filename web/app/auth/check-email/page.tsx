"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

export default function CheckEmailPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  useEffect(() => {
    const u = new URL(window.location.href)
    setEmail(u.searchParams.get("email"))
    setRedirectTo(u.searchParams.get("redirectTo"))
  }, [])

  const obfuscated = useMemo(() => {
    const safeEmail = email || "your email"
    const parts = safeEmail.split("@")
    if (parts.length !== 2) return email
    const [user, domain] = parts
    const safeUser = user.length <= 2 ? "**" : `${user[0]}***${user[user.length - 1]}`
    return `${safeUser}@${domain}`
  }, [email])

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4">
        ✓
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
      <p className="text-gray-600 mb-6">We sent a magic sign-in link to {obfuscated}.</p>
      <p className="text-sm text-gray-500 mb-8">Open the link on this device to finish signing in.</p>

      <div className="flex flex-col gap-3">
        <Button variant="outline" asChild>
          <a href={`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo || "/")}`}>Use other log-in methods</a>
        </Button>
      </div>

      <div className="mt-10 text-left text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-2">Troubleshooting</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>It can take up to a minute for the email to arrive.</li>
          <li>Check spam/junk folders.</li>
          <li>Corporate filters may block external links.</li>
        </ul>
      </div>
    </div>
  )
}


