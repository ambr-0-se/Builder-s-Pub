import { describe, it, expect, vi } from "vitest"
import { createRing } from "@/lib/utils/ring"

describe("ring buffer", () => {
  it("keeps only the last N items and preserves order", () => {
    const ring = createRing<number>(3)
    ring.add(1); ring.add(2); ring.add(3); ring.add(4)
    expect(ring.get()).toEqual([2,3,4])
  })

  it("serialize trims to byte cap and age", () => {
    vi.useFakeTimers()
    const ring = createRing<any>(10)
    const now = Date.now()
    for (let i=0; i<10; i++) ring.add({ ts: now, type: "route", href: `/p/${i}` })
    // very small cap forces trimming
    const out = ring.serialize(50, 5*60_000)
    const bytes = new TextEncoder().encode(JSON.stringify(out)).length
    expect(bytes).toBeLessThanOrEqual(50)
  })
})


