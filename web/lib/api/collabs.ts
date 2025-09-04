import type { ListCollabsParams } from "@/lib/types"
import type { CollaborationWithRelations } from "@/lib/server/collabs"

export async function listCollabs(params: ListCollabsParams = {}): Promise<{ items: CollaborationWithRelations[]; nextCursor?: string }> {
  const sp = new URLSearchParams()
  if (params.limit) sp.set("limit", String(params.limit))
  if (params.q) sp.set("q", params.q)
  if (params.cursor) sp.set("cursor", params.cursor)
  if (params.stages && params.stages.length) sp.append("stages", params.stages.join(","))
  if (params.projectTypes && params.projectTypes.length) sp.append("projectTypes", params.projectTypes.join(","))
  if (params.techTagIds && params.techTagIds.length) sp.append("techTagIds", params.techTagIds.join(","))
  if (params.categoryTagIds && params.categoryTagIds.length) sp.append("categoryTagIds", params.categoryTagIds.join(","))

  const res = await fetch(`/api/collaborations/list?${sp.toString()}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch collaborations")
  const json = await res.json()
  const items = (json.items || []).map((c: any) => ({
    ...c,
    collaboration: { ...c.collaboration, createdAt: new Date(c.collaboration.createdAt) },
  })) as CollaborationWithRelations[]
  return { items, nextCursor: json.nextCursor }
}


