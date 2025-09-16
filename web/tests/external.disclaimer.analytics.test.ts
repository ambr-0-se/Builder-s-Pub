import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/analytics", () => ({
  useAnalytics: () => ({ track: vi.fn() }),
}))

describe("ExternalLinkDisclaimer analytics", () => {
  it("buildExternalEventProps returns safe props", async () => {
    const { buildExternalEventProps } = await import("@/lib/utils/external")
    const p = buildExternalEventProps("https://example.com/path?q=1", "https://a.test/")
    expect(p.href).toContain("https://example.com/")
    expect(p.host).toBe("example.com")
  })
})


