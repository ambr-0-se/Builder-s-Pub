import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCollab } from "@/lib/api/mockCollabs"

interface CollabDetailPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: CollabDetailPageProps): Promise<Metadata> {
  const collab = await getCollab(params.id)

  if (!collab) {
    return {
      title: "Collaboration Not Found - Builder's Pub",
    }
  }

  return {
    title: `${collab.title} - Builder's Pub`,
    description: collab.description,
  }
}

export default async function CollabDetailPage({ params }: CollabDetailPageProps) {
  const collab = await getCollab(params.id)

  if (!collab) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-8 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className="capitalize">
                  {collab.kind}
                </Badge>
                <span className="text-sm text-gray-500">
                  Posted by {collab.owner.displayName} on {collab.createdAt.toLocaleDateString()}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{collab.title}</h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {collab.region && (
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-600">{collab.region}</span>
                  </div>
                )}
                {collab.commitment && (
                  <div>
                    <span className="font-medium text-gray-700">Commitment:</span>
                    <span className="ml-2 text-gray-600">{collab.commitment}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-600 capitalize">{collab.kind}</span>
                </div>
              </div>
            </div>

            <Button>Contact</Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{collab.description}</div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Needed</h3>
            <div className="flex flex-wrap gap-2">
              {collab.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
