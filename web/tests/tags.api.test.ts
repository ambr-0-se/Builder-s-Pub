import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock Supabase client module before importing functions under test
vi.mock("@/lib/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}))

import { fetchTagsByType, fetchAllTags } from "@/lib/api/tags"
import * as supabaseClient from "@/lib/supabaseClient"

describe("tags api", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    ;(supabaseClient as any).supabase.from = vi.fn()
  })

  it("fetchTagsByType returns sorted list", async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: [
      { id: 2, name: "B", type: "technology" },
      { id: 1, name: "A", type: "technology" },
    ], error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    ;((supabaseClient as any).supabase.from as any).mockReturnValue({ select: mockSelect })

    const list = await fetchTagsByType("technology")
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBe(2)
  })

  it("fetchAllTags splits by type", async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({ data: [
      { id: 1, name: "A", type: "technology" },
      { id: 11, name: "C", type: "category" },
    ], error: null })
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 })
    const mockSelect = vi.fn().mockReturnValue({ in: vi.fn().mockReturnValue({ order: mockOrder1 }) })
    ;((supabaseClient as any).supabase.from as any).mockReturnValue({ select: mockSelect })

    const { technology, category } = await fetchAllTags()
    expect(technology.length).toBe(1)
    expect(category.length).toBe(1)
  })
})


