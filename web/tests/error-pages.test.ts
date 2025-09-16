import { describe, it, expect } from "vitest"

describe("App error pages", () => {
  it("exports GlobalError component", async () => {
    const mod = await import("@/app/error")
    expect(typeof mod.default).toBe("function")
  })

  it("exports NotFound component", async () => {
    const mod = await import("@/app/not-found")
    expect(typeof mod.default).toBe("function")
  })
})


