"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/api/auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SignInPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const trimmed = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("Please enter a valid email address")
      return
    }

    setPending(true)
    try {
      const currentUrl = new URL(window.location.href)
      const redirectTo = currentUrl.searchParams.get("redirectTo") || "/"
      await signIn(trimmed, { redirectTo })
      router.replace(`/auth/check-email?email=${encodeURIComponent(trimmed)}&redirectTo=${encodeURIComponent(redirectTo)}`)
    } catch (err) {
      setError("Failed to send magic link. Please try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h1>
      <p className="text-gray-600 mb-8">Use your email to receive a magic link.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            error={error}
            disabled={pending}
          />
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending magic link..." : "Send magic link"}
        </Button>
      </form>

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">More options coming soon:</p>
        <div className="grid grid-cols-1 gap-2 mt-3">
          <Button variant="outline" disabled>
            Continue with Google (soon)
          </Button>
          <Button variant="outline" disabled>
            Continue with GitHub (soon)
          </Button>
        </div>
      </div>
    </div>
  )
}


