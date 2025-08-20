import { isAdmin } from "@/lib/server/admin"
import { AdminCreateTagForm } from "./AdminCreateTagForm"

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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Tags</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Tag</h2>
        <AdminCreateTagForm />
      </div>
    </div>
  )
}
