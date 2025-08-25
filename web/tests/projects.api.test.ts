import { describe, it, expect, vi } from "vitest"

const mockItems = [
	{
		project: { id: "p1", ownerId: "u1", title: "T", tagline: "tag", description: "d", demoUrl: "https://demo", createdAt: new Date().toISOString() },
		tags: { technology: [], category: [] },
		upvoteCount: 1,
		comments: [],
		owner: { userId: "u1", displayName: "User" },
	},
]

vi.mock("@/lib/server/projects", () => ({
	listProjects: vi.fn(async () => ({ items: mockItems.map((p) => ({ ...p, project: { ...p.project, createdAt: new Date().toISOString() } })), nextCursor: undefined })),
	getUserProjectUpvotesMap: vi.fn(async () => new Map([["p1", true]])),
}))

vi.mock("@/lib/supabaseServer", () => ({
	getServerSupabase: vi.fn(async () => ({
		auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
	})),
}))

describe("/api/projects/list", () => {
	it("responds with items and attaches hasUserUpvoted when signed-in", async () => {
		const { GET } = await import("@/app/api/projects/list/route")
		const req = new Request("http://localhost/api/projects/list?sort=recent&limit=3")
		const res = await GET(req)
		const json = await (res as any).json()
		expect(json).toHaveProperty("items")
		expect(json.items[0]).toHaveProperty("hasUserUpvoted")
		expect(json.items[0].hasUserUpvoted).toBe(true)
	})
})


