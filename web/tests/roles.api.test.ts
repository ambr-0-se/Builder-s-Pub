import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabaseServer", () => ({
  getServerSupabase: vi.fn(async () => ({
    from: () => ({
      select: () => ({ order: async () => ({ data: [{ name: "AI Engineer" }, { name: "Backend Engineer" }], error: null }) }),
    }),
  })),
}))

describe("/api/roles/list", () => {
  it("returns alphabetized role names", async () => {
    const { GET } = await import("@/app/api/roles/list/route")
    const res = await GET()
    const json = await (res as any).json()
    expect(Array.isArray(json.roles)).toBe(true)
    expect(json.roles[0]).toBe("AI Engineer")
  })
})


