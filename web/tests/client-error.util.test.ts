import { describe, it, expect, vi, beforeEach } from "vitest"

import { createThrottledSender, signatureOf } from "@/lib/utils/client-error"

describe("client error util", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it("throttles duplicate messages within window", async () => {
    const sent: any[] = []
    const send = vi.fn(async (i) => void sent.push(i))
    const maybeSend = createThrottledSender(send, 30000)
    const input = { message: "boom", url: "/a" }
    const r1 = await maybeSend(input)
    const r2 = await maybeSend(input)
    expect(r1).toBe(true)
    expect(r2).toBe(false)
    expect(sent.length).toBe(1)
    vi.advanceTimersByTime(30001)
    const r3 = await maybeSend(input)
    expect(r3).toBe(true)
    expect(sent.length).toBe(2)
  })

  it("allows same message after window elapses", async () => {
    const send = vi.fn(async () => {})
    const maybeSend = createThrottledSender(send, 1000)
    const input = { message: "boom", url: "/a" }
    await maybeSend(input)
    vi.advanceTimersByTime(999)
    const r2 = await maybeSend(input)
    expect(r2).toBe(false)
    vi.advanceTimersByTime(2)
    const r3 = await maybeSend(input)
    expect(r3).toBe(true)
  })
  it("signatureOf includes message and url", () => {
    const sig = signatureOf({ message: "a", url: "/u" })
    expect(sig).toContain("a@@/u")
  })
})


