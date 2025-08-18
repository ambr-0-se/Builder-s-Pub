import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication - Builder's Pub",
  description: "Completing authentication process",
}

export default function AuthCallbackPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Completing Sign In</h1>
      <p className="text-gray-600">Please wait while we complete your authentication...</p>

      {/* TODO: Replace with Supabase auth callback handling */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>TODO:</strong> Implement Supabase auth callback handling here
        </p>
      </div>
    </div>
  )
}
