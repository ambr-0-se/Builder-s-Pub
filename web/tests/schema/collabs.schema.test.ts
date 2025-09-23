import { describe, it, expect } from "vitest"

describe("collaborations schema validation (roles)", () => {
  it("rejects duplicate roles (case-insensitive)", async () => {
    const { createCollabSchema } = await import("@/app/collaborations/schema")
    const parsed = createCollabSchema.safeParse({
      title: "T",
      affiliatedOrg: "",
      projectTypes: ["personal"],
      description: "D",
      stage: "ideation",
      lookingFor: [
        { role: "AI Engineer" },
        { role: "ai engineer" },
      ],
      contact: "me@example.com",
      remarks: "",
      techTagIds: [1],
      categoryTagIds: [2],
    })
    expect(parsed.success).toBe(false)
  })

  it("rejects roles longer than 80 characters", async () => {
    const { createCollabSchema } = await import("@/app/collaborations/schema")
    const longRole = "A".repeat(81)
    const parsed = createCollabSchema.safeParse({
      title: "T",
      affiliatedOrg: "",
      projectTypes: ["personal"],
      description: "D",
      stage: "ideation",
      lookingFor: [
        { role: longRole },
      ],
      contact: "me@example.com",
      remarks: "",
      techTagIds: [1],
      categoryTagIds: [2],
    })
    expect(parsed.success).toBe(false)
  })
})


