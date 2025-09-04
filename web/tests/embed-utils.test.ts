import { describe, it, expect } from "vitest"
import { parseEmbedUrl, isAllowedEmbedHost } from "@/lib/utils/embed-utils"

describe("embed-utils", () => {
  it("allows youtube hosts", () => {
    expect(isAllowedEmbedHost("youtube.com")).toBe(true)
    expect(isAllowedEmbedHost("www.youtube.com")).toBe(true)
    expect(isAllowedEmbedHost("youtu.be")).toBe(true)
  })

  it("allows vercel subdomains", () => {
    expect(isAllowedEmbedHost("vercel.app")).toBe(true)
    expect(isAllowedEmbedHost("my-app.vercel.app")).toBe(true)
  })

  it("blocks unknown hosts", () => {
    expect(isAllowedEmbedHost("example.com")).toBe(false)
  })

  it("parses youtube watch urls", () => {
    const out = parseEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    expect(out.kind).toBe("youtube")
    expect(out.embedUrl).toContain("/embed/dQw4w9WgXcQ")
  })

  it("parses youtu.be short urls", () => {
    const out = parseEmbedUrl("https://youtu.be/dQw4w9WgXcQ")
    expect(out.kind).toBe("youtube")
    expect(out.embedUrl).toContain("/embed/dQw4w9WgXcQ")
  })

  it("keeps vercel apps as-is", () => {
    const out = parseEmbedUrl("https://demo-app.vercel.app")
    expect(out.kind).toBe("vercel")
    expect(out.embedUrl).toBe("https://demo-app.vercel.app/")
  })

  it("marks unsupported hosts", () => {
    const out = parseEmbedUrl("https://example.com/demo")
    expect(out.kind).toBe("unsupported")
    expect(out.embedUrl).toBeUndefined()
  })
})


