import CollaborationsClient from "./CollaborationsClient"
import { Suspense } from "react"
import { getServerSupabase } from "@/lib/supabaseServer"
import Link from "next/link"

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CollaborationsPage() {
  const supabase = await getServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  // If not signed-in, show a friendly login-required screen instead of redirect
  if (!auth.user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign in to view collaborations</h1>
        <p className="text-gray-600 mb-8">Join the community to browse and post collaboration opportunities.</p>
        <Link href="/auth/sign-in?redirectTo=/collaborations" className="inline-flex items-center px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900">Sign in</Link>
      </div>
    )
  }
  return (
    <Suspense>
      <CollaborationsClient />
    </Suspense>
  )
}
