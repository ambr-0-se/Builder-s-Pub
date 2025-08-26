import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCollab } from "@/lib/server/collabs"
import { getServerSupabase } from "@/lib/supabaseServer"
import { toggleCollabUpvoteAction, addCollabCommentAction, deleteCollabCommentAction } from "@/app/collaborations/actions"
import { CollabUpvoteButton } from "@/components/features/collaborations/collab-upvote-button"
import { CollabCommentForm } from "@/components/features/collaborations/collab-comment-form"
import { CollabCommentList } from "@/components/features/collaborations/collab-comment-list"
import { RoleCard } from "@/components/features/collaborations/role-card"
import { HiringToggle } from "@/components/features/collaborations/hiring-toggle"
import { updateCollabAction } from "@/app/collaborations/actions"
import { formatStage, formatProjectType } from "@/lib/collabs/options"

interface CollabDetailPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: CollabDetailPageProps): Promise<Metadata> {
  const p = await params
  const collab = await getCollab(p.id)

  if (!collab) {
    return {
      title: "Collaboration Not Found - Builder's Pub",
    }
  }

  return {
    title: `${collab.collaboration.title} - Builder's Pub`,
    description: collab.collaboration.description,
  }
}

export default async function CollabDetailPage({ params }: CollabDetailPageProps) {
  const p = await params
  const item = await getCollab(p.id)

  if (!item) {
    notFound()
  }

  const supabase = await getServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const isOwner = !!auth.user && auth.user.id === item.collaboration.ownerId

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-8 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-gray-500">Posted by {item.owner.displayName} on {item.collaboration.createdAt.toLocaleDateString?.() || new Date(item.collaboration.createdAt as any).toLocaleDateString()}</span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{item.collaboration.title}</h1>

              <div className="space-y-2 text-sm">
                {item.collaboration.affiliatedOrg && (
                  <div className="flex items-baseline gap-2 overflow-hidden">
                    <span className="font-medium text-gray-700 whitespace-nowrap">Affiliated Organisation:</span>
                    <span className="text-gray-600 truncate min-w-0">{item.collaboration.affiliatedOrg.replace(/\s+/g, " ")}</span>
                  </div>
                )}
                {Array.isArray((item.collaboration as any).projectTypes) && (item.collaboration as any).projectTypes!.length > 0 && (
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium text-gray-700 whitespace-nowrap">Project Types:</span>
                    <div className="flex flex-wrap gap-2">
                      {(item.collaboration as any).projectTypes.map((pt: string, i: number) => (
                        <Badge key={`pt-${i}`} variant="outline" className="capitalize">{formatProjectType(pt as any)}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {item.collaboration.stage && (
                  <div className="flex items-baseline gap-2 overflow-hidden">
                    <span className="font-medium text-gray-700 whitespace-nowrap">Stage:</span>
                    <span className="text-gray-600 truncate min-w-0">{formatStage(item.collaboration.stage as any)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <CollabUpvoteButton collaborationId={item.collaboration.id} initialCount={item.upvoteCount} hasUserUpvoted={item.hasUserUpvoted} />
              <HiringToggle collaborationId={item.collaboration.id} isHiring={item.collaboration.isHiring !== false} isOwner={isOwner} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Description</h2>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{item.collaboration.description}</div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Roles Hiring</h3>
            <div className="space-y-4">
              {(item.collaboration.lookingFor || []).map((r, index) => (
                <RoleCard key={index} item={r as any} />
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Contact</h3>
              <Contact value={item.collaboration.contact} />
              <div className="mt-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.technology.map((t) => (
                    <Badge key={`t-${t.id}`} variant="default" className="text-xs">{t.name}</Badge>
                  ))}
                  {item.tags.category.map((t) => (
                    <Badge key={`c-${t.id}`} variant="outline" className="text-xs">{t.name}</Badge>
                  ))}
                </div>
              </div>
            </div>
            {item.collaboration.remarks && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Remarks</h3>
                <div className="text-gray-700 whitespace-pre-wrap">{item.collaboration.remarks}</div>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 border border-yellow-300 bg-yellow-50 rounded-md text-sm text-yellow-900">
            Warning: Posts are user-submitted and not verified. Beware of scams/risks, avoid suspicious links, and you are responsible for your actions.
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
            <CollabCommentForm collaborationId={item.collaboration.id} />
            <div className="mt-4">
              <CollabCommentList comments={item.comments || []} collaborationId={item.collaboration.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Contact({ value }: { value: string }) {
  const v = (value || "").trim()
  if (!v) return <span className="text-gray-500">Not provided</span>
  const isUrl = /^https?:\/\//i.test(v)
  const isEmail = /@/.test(v) && !v.includes(" ")
  if (isUrl) {
    return (
      <a href={v} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
        {v}
      </a>
    )
  }
  if (isEmail) {
    return (
      <a href={`mailto:${v}`} className="text-blue-600 hover:underline break-all">
        {v}
      </a>
    )
  }
  return <span className="text-gray-700 break-all">{v}</span>
}


