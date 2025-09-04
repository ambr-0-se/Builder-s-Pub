import type { ListProjectsParams, ProjectWithRelations } from "@/lib/types"

export async function listProjects(params: ListProjectsParams = {}): Promise<{ items: ProjectWithRelations[]; nextCursor?: string }> {
	const sp = new URLSearchParams()
	if (params.sort) sp.set("sort", params.sort)
	if (params.limit) sp.set("limit", String(params.limit))
	if (params.q) sp.set("q", params.q)
    if (params.cursor) sp.set("cursor", params.cursor)
	if (params.techTagIds && params.techTagIds.length) sp.append("techTagIds", params.techTagIds.join(","))
	if (params.categoryTagIds && params.categoryTagIds.length) sp.append("categoryTagIds", params.categoryTagIds.join(","))

	const res = await fetch(`/api/projects/list?${sp.toString()}`, { cache: "no-store" })
	if (!res.ok) throw new Error("Failed to fetch projects")
	const json = await res.json()
	const items = (json.items || []).map((p: any) => ({
		...p,
		project: {
			...p.project,
			createdAt: new Date(p.project.createdAt),
		},
	})) as ProjectWithRelations[]
	return { items, nextCursor: json.nextCursor }
}


