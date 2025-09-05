import { describe, it, expect, vi, beforeEach } from "vitest"

// In-memory rate_limits store
const windowKey = (action: string, user: string, start: string) => `${action}:${user}:${start}`
const store: Record<string, number> = {}

vi.mock("@/lib/supabaseServer", () => ({
  getServerSupabase: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "rate_limits") {
        return {
          select: vi.fn().mockImplementation(() => {
            const where: Record<string, string> = {}
            const chain: any = {
              eq: vi.fn().mockImplementation((col: string, val: string) => {
                where[col] = val
                return chain
              }),
              maybeSingle: vi.fn(async () => {
                const key = windowKey(where["action"], where["user_id"], where["window_start"]) || ""
                const count = store[key]
                return count !== undefined ? { data: { count } as any, error: null } : { data: null as any, error: null }
              }),
            }
            return chain
          }),
          upsert: vi.fn().mockImplementation(async (row: any) => {
            const key = windowKey(row.action, row.user_id, row.window_start)
            store[key] = row.count
            return { error: null }
          }),
        }
      }
      if (table === "projects") {
        return {
          insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn(async () => ({ data: { id: `p${Math.random()}` } })) }) })
        }
      }
      if (table === "project_tags") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) }
      }
      return { select: vi.fn() }
    }),
  })),
}))

describe("project creation daily rate limit", () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k]
  })

  it("allows up to 5 creations per day, blocks the 6th", async () => {
    const { createProject } = await import("@/lib/server/projects")
    const input = {
      title: "A",
      tagline: "B",
      description: "C",
      demoUrl: "https://example.com",
      sourceUrl: "",
      techTagIds: [1],
      categoryTagIds: [2],
    }
    for (let i = 0; i < 5; i++) {
      const res = await createProject(input as any)
      expect("id" in (res as any)).toBe(true)
    }
    const blocked = await createProject(input as any)
    expect((blocked as any).formError).toMatch(/Daily limit reached/)
  })
})


