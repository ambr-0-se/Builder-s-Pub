import { describe, it, expect } from "vitest"

describe("tag-picker utils", () => {
  it("filters by substring case-insensitively", async () => {
    const { filterTags } = await import("@/lib/utils/tag-picker")
    const tags = [
      { id: 1, name: "NLP", type: "technology" as const },
      { id: 2, name: "Computer Vision", type: "technology" as const },
    ]
    expect(filterTags(tags as any, "vis").map((t) => t.name)).toEqual(["Computer Vision"])
    expect(filterTags(tags as any, "").length).toBe(2)
  })

  it("selects first N suggested", async () => {
    const { selectSuggested } = await import("@/lib/utils/tag-picker")
    const tags = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `T${i + 1}`, type: "technology" as const }))
    expect(selectSuggested(tags as any, 12).length).toBe(12)
    expect(selectSuggested(tags as any, 0).length).toBe(0)
  })
})


