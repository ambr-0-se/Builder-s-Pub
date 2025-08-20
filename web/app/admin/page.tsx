import Link from "next/link"
import { isAdmin } from "@/lib/server/admin"

export default async function AdminHomePage() {
  const ok = await isAdmin()
  if (!ok) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">403 — Admins Only</h1>
        <p className="text-gray-600">You do not have access to this page.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link
          href="/admin/tags"
          className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Manage Tags</h2>
          <p className="text-gray-600 text-sm">Create and manage technology and category tags.</p>
        </Link>
      </div>
    </div>
  )
}


