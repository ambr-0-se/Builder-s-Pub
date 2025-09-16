import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/supabaseServer", () => ({
  getServerSupabase: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "user-123" } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { count: 0 } }) }) }) })
      }),
      upsert: async () => ({}),
    }),
  })),
}))

describe("/api/errors/report", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("accepts a well-formed report", async () => {
    const { POST } = await import("@/app/api/errors/report/route")
    const req = new Request("http://localhost/api/errors/report", {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "jest", "x-real-ip": "1.1.1.1" },
      body: JSON.stringify({ message: "TypeError: x is undefined", url: "/path" }),
    })
    const res = await POST(req)
    const json = await (res as any).json()
    expect(json).toEqual({ ok: true })
  })

  it("rate limits excessive reports", async () => {
    vi.doMock("@/lib/server/rate-limiting", () => ({
      checkRateLimit: vi.fn(async () => ({ limited: true, retryAfterSec: 42 })),
    }))
    const { POST } = await import("@/app/api/errors/report/route")
    const req = new Request("http://localhost/api/errors/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "oops" }),
    })
    const res = await POST(req)
    const json = await (res as any).json()
    expect(json.error).toBe("rate_limited")
    expect(json.retryAfterSec).toBe(42)
  })
})


