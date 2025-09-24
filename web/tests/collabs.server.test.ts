import { describe, it, expect, vi, beforeEach } from "vitest"

// Helper to build a chainable query mock
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

// Mock server supabase and supabase-js createClient
vi.mock("@/lib/supabaseServer", () => ({
  getServerSupabase: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: (table: string) => {
      // Mirror supabase-js mock behavior for server client
      if (table === "collaborations") {
        const rows = [
          { id: "c1", owner_id: "u1", kind: "ongoing", title: "t1", description: "d", looking_for: [{ role: "React Dev" }], created_at: new Date().toISOString(), soft_deleted: false, is_hiring: true },
          { id: "c2", owner_id: "u1", kind: "planned", title: "t2", description: "d", looking_for: [{ role: "Designer" }], created_at: new Date().toISOString(), soft_deleted: false, is_hiring: true },
          { id: "c3", owner_id: "u1", kind: "ongoing", title: "t3", description: "d", looking_for: [{ role: "PM" }], created_at: new Date().toISOString(), soft_deleted: false, is_hiring: false },
        ]
        const chain = buildSelectChain(rows)
        return {
          select: vi.fn(() => chain),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: rows[0], error: null }),
          update: vi.fn().mockReturnValue({ eq: vi.fn(async () => ({}) ) }),
          insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn(async () => ({ data: { id: "c1" } })) }) }),
          delete: vi.fn().mockReturnValue({ eq: vi.fn(async () => ({}) ) }),
        }
      }
      if (table === "collaboration_tags" || table === "tags" || table === "profiles" || table === "collaboration_upvotes" || table === "collab_comments") {
        const base = {
          select: vi.fn(() => buildSelectChain([])),
          in: vi.fn(() => buildSelectChain([])),
        }
        if (table === "collaboration_tags") {
          return {
            ...base,
            insert: vi.fn(async () => ({ data: null, error: null })),
          }
        }
        return base
      }
      if (table === "collaboration_roles") {
        return {
          insert: vi.fn(async () => ({})),
          delete: vi.fn(() => ({ eq: vi.fn(async () => ({}) ) })),
          select: vi.fn(() => ({ ilike: vi.fn(async () => ({ data: [], error: null })) })),
        }
      }
      return {
        select: vi.fn(() => buildSelectChain([])),
      }
    },
  }))
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "collaborations") {
        const rows = [
          { id: "c1", owner_id: "u1", kind: "ongoing", title: "t1", description: "d", looking_for: [{ role: "React Dev" }], created_at: new Date().toISOString(), soft_deleted: false, is_hiring: true },
          { id: "c2", owner_id: "u1", kind: "planned", title: "t2", description: "d", looking_for: [{ role: "Designer" }], created_at: new Date().toISOString(), soft_deleted: false, is_hiring: true },
          { id: "c3", owner_id: "u1", kind: "ongoing", title: "t3", description: "d", looking_for: [{ role: "PM" }], created_at: new Date().toISOString(), soft_deleted: false, is_hiring: false },
        ]
        const chain = buildSelectChain(rows)
        return {
          select: vi.fn(() => chain),
          // Single fetch path used by getCollab
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: rows[0], error: null }),
        }
      }
      if (table === "collaboration_tags" || table === "tags" || table === "profiles" || table === "collaboration_upvotes" || table === "collab_comments") {
        // Return empty sets by default
        return {
          select: vi.fn(() => buildSelectChain([])),
          in: vi.fn(() => buildSelectChain([])),
        }
      }
      return {
        select: vi.fn(() => buildSelectChain([])),
      }
    }),
  })),
}))

describe("server collaborations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("createCollab returns id for valid input", async () => {
    const { createCollab } = await import("@/lib/server/collabs")
    const res = await createCollab({
      title: "Title",
      affiliatedOrg: "",
      projectTypes: ["personal"],
      description: "Desc",
      stage: "ideation",
      lookingFor: [{ role: "React", amount: 1 }],
      contact: "me@example.com",
      remarks: "",
      techTagIds: [1],
      categoryTagIds: [2],
    })
    expect("id" in (res as any)).toBe(true)
  })

  it("createCollab rejects when unauthorized", async () => {
    const { getServerSupabase } = await import("@/lib/supabaseServer")
    ;(getServerSupabase as any).mockResolvedValueOnce({ auth: { getUser: async () => ({ data: { user: null } }) } })
    const { createCollab } = await import("@/lib/server/collabs")
    const res = await createCollab({
      title: "Title",
      affiliatedOrg: "",
      projectTypes: ["personal"],
      description: "Desc",
      stage: "ideation",
      lookingFor: [{ role: "React", amount: 1 }],
      contact: "me@example.com",
      remarks: "",
      techTagIds: [1],
      categoryTagIds: [2],
    })
    expect(res).toEqual({ formError: "unauthorized" })
  })

  it("listCollabs ranks q and respects is_hiring filter by default (requires auth)", async () => {
    const { listCollabs } = await import("@/lib/server/collabs")
    const { items } = await listCollabs({ q: "react" })
    // Only c1 matches react in looking_for and is_hiring true; c3 is closed
    expect(items.map((i) => i.collaboration.id)).toEqual(["c1"]) 
  })

  it("listCollabs hides closed (is_hiring=false) by default", async () => {
    const { listCollabs } = await import("@/lib/server/collabs")
    const { items } = await listCollabs({})
    const ids = items.map((i) => i.collaboration.id)
    expect(ids).not.toContain("c3")
  })

  it("updateCollab allows toggling isHiring", async () => {
    const { updateCollab } = await import("@/lib/server/collabs")
    const res = await updateCollab("c1", { isHiring: false } as any)
    expect((res as any).ok).toBe(true)
  })
})



