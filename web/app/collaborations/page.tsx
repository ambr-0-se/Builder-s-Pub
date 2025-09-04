import Link from "next/link"
import { listCollabs } from "@/lib/server/collabs"
import { Badge } from "@/components/ui/badge"
import { formatProjectType } from "@/lib/collabs/options"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CollaborationsPage({ searchParams }: PageProps) {
  // Legacy filters removed; render recent list for now
  const { items } = await listCollabs({})

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collaborations</h1>
          <p className="text-gray-600 mt-2">Find collaborators and join exciting projects</p>
        </div>
        <Button asChild>
          <Link href="/collaborations/new">Post Collaboration</Link>
        </Button>
      </div>

      {/* Filters for kind/skills removed in Stage 9; unified search page will host filters */}

      <div className="mb-6">
        <p className="text-sm text-gray-600">{items.length} collaborations found</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No collaborations found"
          description="Be the first to post a collaboration opportunity!"
          action={<Button asChild><Link href="/collaborations/new">Post Collaboration</Link></Button>}
        />
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.collaboration.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500">by {item.owner.displayName}</span>
                  </div>
                  <Link href={`/collaborations/${item.collaboration.id}`} className="group">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">{item.collaboration.title}</h3>
                  </Link>
                  <p className="text-gray-600 mb-3 line-clamp-2">{item.collaboration.description}</p>
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <span>📅 {item.collaboration.createdAt.toLocaleDateString?.() || new Date(item.collaboration.createdAt as any).toLocaleDateString()}</span>
                    {typeof item.commentCount === "number" && <span>💬 {item.commentCount}</span>}
                    <span>⬆️ {item.upvoteCount}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                {Array.isArray((item.collaboration as any).projectTypes) && (
                  <>
                    {(item.collaboration as any).projectTypes.map((pt: string, i: number) => (
                      <Badge key={`pt-${i}`} variant="outline" className="capitalize">{formatProjectType(pt as any)}</Badge>
                    ))}
                  </>
                )}
                <Badge variant={(item.collaboration as any).isHiring === false ? "outline" : undefined} className={(item.collaboration as any).isHiring === false ? "bg-white text-gray-800 border border-gray-300" : "bg-black text-white border border-black"}>
                  {(item.collaboration as any).isHiring === false ? "No longer hiring" : "Hiring"}
                </Badge>
              </div>
              {item.collaboration.lookingFor?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.collaboration.lookingFor.slice(0, 3).map((r, idx) => (
                    <Badge key={idx} variant="secondary">{r.role}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
