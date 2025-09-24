import { describe, it, expect, vi, beforeEach } from "vitest"

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
  beforeEach(() => {
    vi.resetModules()
    // Default: authenticated user for non-401 tests
    vi.doMock("@/lib/supabaseServer", () => ({
      getServerSupabase: vi.fn(async () => ({ auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) } })),
    }))
  })
  it("responds with items and nextCursor", async () => {
    const { GET } = await import("@/app/api/collaborations/list/route")
    const req = new Request("http://localhost/api/collaborations/list?q=ai&limit=2&stages=mvp_development")
    const res = await GET(req)
    const json = await (res as any).json()
    expect(json).toHaveProperty("items")
    expect(Array.isArray(json.items)).toBe(true)
  })

  it("returns 401 when anonymous (Stage 17)", async () => {
    // Mock getServerSupabase to return no user
    vi.resetModules()
    vi.doMock("@/lib/supabaseServer", () => ({
      getServerSupabase: vi.fn(async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } })),
    }))
    const { GET } = await import("@/app/api/collaborations/list/route")
    const req = new Request("http://localhost/api/collaborations/list")
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })
})

describe("/api/collaborations/get", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock("@/lib/supabaseServer", () => ({
      getServerSupabase: vi.fn(async () => ({ auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) } })),
    }))
    // Mocked collab detail response via server module is not needed here; route will call server getCollab under auth
    vi.doMock("@/lib/server/collabs", () => ({
      getCollab: vi.fn(async () => ({
        collaboration: { id: "c1", ownerId: "u1", title: "T", description: "d", createdAt: new Date(), isHiring: true, lookingFor: [] },
        tags: { technology: [], category: [] },
        upvoteCount: 0,
        owner: { userId: "u1", displayName: "User" },
      })),
    }))
  })
  it("returns 401 when anonymous (Stage 17)", async () => {
    vi.resetModules()
    vi.doMock("@/lib/supabaseServer", () => ({
      getServerSupabase: vi.fn(async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } })),
    }))
    const { GET } = await import("@/app/api/collaborations/get/route")
    const req = new Request("http://localhost/api/collaborations/get?id=c1")
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })
})


