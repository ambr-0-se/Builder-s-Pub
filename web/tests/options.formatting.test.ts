import { describe, it, expect } from "vitest"

describe("collab options formatting", () => {
  it("formatStage maps value to label", async () => {
    const { formatStage } = await import("@/lib/collabs/options")
    expect(formatStage("mvp_development" as any)).toBe("MVP Development")
    expect(formatStage("requirements_analysis" as any)).toBe("Requirements Gathering and Analysis")
  })

  it("formatProjectType maps value to label", async () => {
    const { formatProjectType } = await import("@/lib/collabs/options")
    expect(formatProjectType("open_source" as any)).toBe("Open-source")
    expect(formatProjectType("startup_registered" as any)).toBe("Startup (company registered)")
  })
})


