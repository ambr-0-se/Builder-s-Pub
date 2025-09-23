import { describe, it, expect, vi, beforeEach } from "vitest"

// Build a basic select chain mock
function buildSelectChain(data: any[]) {
  return {
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: data[0] || null, error: null }),
  }
}

describe("collaborations list (role-mode search & ranking)", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("excludes is_hiring=false in role mode and ranks role > title > desc", async () => {
    vi.mock("@supabase/supabase-js", () => ({
      createClient: vi.fn(() => ({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "collaborations") {
            const rows = [
              { id: "c1", owner_id: "u1", kind: "ongoing", title: "Alpha", description: "desc", looking_for: [{ role: "AI Engineer" }], created_at: new Date().toISOString(), soft_deleted: false, is_hiring: true },
              { id: "c2", owner_id: "u1", kind: "ongoing", title: "Beta AI", description: "desc", looking_for: [{ role: "Designer" }], created_at: new Date().toISOString(), soft_deleted: false, is_hiring: true },
              { id: "c3", owner_id: "u1", kind: "ongoing", title: "Gamma", description: "AI tools", looking_for: [{ role: "PM" }], created_at: new Date().toISOString(), soft_deleted: false, is_hiring: false },
            ]
            return { select: vi.fn(() => buildSelectChain(rows)) }
          }
          if (table === "collaboration_roles") {
            // role ilike '%ai engineer%' returns c1
            return {
              select: vi.fn(() => ({ ilike: vi.fn(async () => ({ data: [{ collaboration_id: "c1" }], error: null })) })),
            }
          }
          if (table === "collaboration_tags" || table === "profiles" || table === "tags" || table === "collaboration_upvotes" || table === "collab_comments") {
            return { select: vi.fn(() => buildSelectChain([])), in: vi.fn(() => buildSelectChain([])) }
          }
          return { select: vi.fn(() => buildSelectChain([])) }
        }),
      })),
    }))

    vi.mock("@/lib/supabaseServer", () => ({
      getServerSupabase: vi.fn(async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } })),
    }))

    const { listCollabs } = await import("@/lib/server/collabs")
    const res = await listCollabs({ mode: "role", role: "AI Engineer", limit: 10 })
    const ids = res.items.map((i) => i.collaboration.id)
    // c3 excluded (is_hiring=false), c1 should rank above c2 due to role match over title match
    expect(ids[0]).toBe("c1")
    expect(ids).not.toContain("c3")
  })
})


