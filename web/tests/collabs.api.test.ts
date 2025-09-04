import { describe, it, expect, vi } from "vitest"

const mockItems = [
  {
    collaboration: { id: "c1", ownerId: "u1", title: "T", description: "d", createdAt: new Date().toISOString(), isHiring: true, projectTypes: ["personal"], lookingFor: [{ role: "Dev" }] },
    tags: { technology: [], category: [] },
    upvoteCount: 0,
    owner: { userId: "u1", displayName: "User" },
  },
]

vi.mock("@/lib/server/collabs", () => ({
  listCollabs: vi.fn(async () => ({ items: mockItems.map((c) => ({ ...c, collaboration: { ...c.collaboration, createdAt: new Date().toISOString() } })), nextCursor: undefined })),
}))

describe("/api/collaborations/list", () => {
  it("responds with items and nextCursor", async () => {
    const { GET } = await import("@/app/api/collaborations/list/route")
    const req = new Request("http://localhost/api/collaborations/list?q=ai&limit=2&stages=mvp_development")
    const res = await GET(req)
    const json = await (res as any).json()
    expect(json).toHaveProperty("items")
    expect(Array.isArray(json.items)).toBe(true)
  })
})


