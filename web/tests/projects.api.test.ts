import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/server/projects", () => ({
	listProjects: vi.fn(async () => ({ items: [], nextCursor: undefined })),
}))

describe("/api/projects/list", () => {
	it("responds with items and nextCursor", async () => {
		const { GET } = await import("@/app/api/projects/list/route")
		const req = new Request("http://localhost/api/projects/list?sort=recent&limit=3")
		const res = await GET(req)
		const json = await (res as any).json()
		expect(json).toHaveProperty("items")
	})
})


