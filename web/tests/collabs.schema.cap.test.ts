import { describe, it, expect } from "vitest"

describe("createCollabSchema tag cap", () => {
  it("rejects more than 5 tech or 3 category tags (ignore project types)", async () => {
    const { createCollabSchema } = await import("@/app/collaborations/schema")
    const tech = Array.from({ length: 6 }, (_, i) => i + 1)
    const cat = Array.from({ length: 4 }, (_, i) => i + 100)
    const { success, error } = createCollabSchema.safeParse({
      title: "A",
      affiliatedOrg: "",
      projectTypes: ["personal"],
      description: "D",
      stage: "mvp_development",
      lookingFor: [{ role: "FE", amount: 1 }],
      contact: "me@example.com",
      remarks: "",
      techTagIds: tech,
      categoryTagIds: cat, // over both per-facet caps
    })
    expect(success).toBe(false)
    expect(error?.issues.some((i) => String(i.message).includes("at most 5 technology"))).toBe(true)
    expect(error?.issues.some((i) => String(i.message).includes("at most 3 category"))).toBe(true)
  })
})


