import { isAdmin } from "@/lib/server/admin"
import { AdminTagManager } from "./tag-manager"
import { getAllTagsServer } from "@/lib/server/tags"

export default async function AdminTagsPage() {
  const ok = await isAdmin()
  if (!ok) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">403 — Admins Only</h1>
        <p className="text-gray-600">You do not have access to this page.</p>
      </div>
    )
  }

  const all = await getAllTagsServer()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Tags</h1>
      <AdminTagManager initialTechnology={all.technology} initialCategory={all.category} />
    </div>
  )
}
