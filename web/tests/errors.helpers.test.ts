import { describe, it, expect } from "vitest"

import { anonymizeUserId, redactPII } from "@/lib/server/errors"

describe("errors helpers", () => {
  it("anonymizes user id deterministically with salt", () => {
    const a = anonymizeUserId("u-1", "salt")
    const b = anonymizeUserId("u-1", "salt")
    const c = anonymizeUserId("u-2", "salt")
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })

  it("redacts emails and urls in strings", () => {
    const s = "email test foo@bar.com and https://example.com/secret/path?q=1"
    const r = String(redactPII(s))
    expect(r).not.toContain("foo@bar.com")
    expect(r).not.toContain("/secret/path")
  })

  it("redacts nested objects", () => {
    const obj = { a: "user a@b.co", b: { url: "http://h.co/p" } }
    const r = redactPII(obj) as any
    expect(r.a).not.toContain("a@b.co")
    expect(r.b.url).not.toContain("/p")
  })
})


