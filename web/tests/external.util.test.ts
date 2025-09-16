import { describe, it, expect } from "vitest"
import { hasDisclaimerAck, isExternalUrl, setDisclaimerAck } from "@/lib/utils/external"

describe("external link utils", () => {
  it("detects external vs same-origin", () => {
    const base = "https://example.com/path"
    expect(isExternalUrl("/a", base)).toBe(false)
    expect(isExternalUrl("https://example.com/b", base)).toBe(false)
    expect(isExternalUrl("https://other.com/b", base)).toBe(true)
  })

  it("localStorage ack toggles", () => {
    const store = new Map<string, string>()
    const fake = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v) },
    } as any
    expect(hasDisclaimerAck(fake)).toBe(false)
    setDisclaimerAck(fake)
    expect(hasDisclaimerAck(fake)).toBe(true)
  })
})


