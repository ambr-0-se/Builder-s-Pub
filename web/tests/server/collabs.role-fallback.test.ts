import { describe, it, expect, vi, beforeEach } from "vitest"

// Helper chain
function chain(data: any[]) {
  return { eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data, error: null }) }
}

describe("role-mode fallback scans looking_for when join table empty", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("returns matches by scanning looking_for even if collaboration_roles returns none", async () => {
    vi.mock("@supabase/supabase-js", () => ({
      createClient: vi.fn(() => ({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "collaborations") {
            const rows = [
              { id: "c1", owner_id: "u1", kind: "ongoing", title: "Zeta", description: "text", looking_for: [{ role: "Agent Engineer" }], created_at: new Date().toISOString(), soft_deleted: false, is_hiring: true },
            ]
            return { select: vi.fn(() => chain(rows)) }
          }
          if (table === "collaboration_roles") {
            // Simulate empty join result
            return { select: vi.fn(() => ({ ilike: vi.fn(async () => ({ data: [], error: null })) })) }
          }
          if (table === "collaboration_tags" || table === "profiles" || table === "tags" || table === "collaboration_upvotes" || table === "collab_comments") {
            return { select: vi.fn(() => chain([])), in: vi.fn(() => chain([])) }
          }
          return { select: vi.fn(() => chain([])) }
        }),
      })),
    }))

    vi.mock("@/lib/supabaseServer", () => ({ getServerSupabase: vi.fn(async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } })) }))

    const { listCollabs } = await import("@/lib/server/collabs")
    const res = await listCollabs({ mode: "role", role: "Agent" })
    expect(res.items.map((i) => i.collaboration.id)).toEqual(["c1"]) // matched via looking_for scan
  })
})


