import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/server/errors", () => ({
  handleReport: vi.fn(async () => ({ ok: true })),
}))

describe("reportProblemAction", () => {
  it("rejects empty message", async () => {
    const mod = await import("@/app/report-problem/actions")
    const res = await mod.reportProblemAction({}, new FormData())
    expect(res.formError).toBeTruthy()
  })

  it("submits message", async () => {
    const mod = await import("@/app/report-problem/actions")
    const fd = new FormData()
    fd.set("message", "hello")
    const res = await mod.reportProblemAction({}, fd)
    expect(res.success).toBe(true)
  })
})


