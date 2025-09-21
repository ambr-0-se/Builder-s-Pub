import { describe, it, expect } from "vitest"
import { normalizeExt, buildObjectPath, pathBelongsToId } from "@/lib/server/logo-utils"

describe("logo-utils", () => {
  it("normalizes allowed extensions", () => {
    expect(normalizeExt("png")).toBe("png")
    expect(normalizeExt(".JPEG")).toBe("jpeg")
    expect(normalizeExt("Svg")).toBe("svg")
    expect(normalizeExt("gif")).toBeNull()
  })

  it("builds object path with id and filename", () => {
    const p = buildObjectPath("project-logos", "abc", "file.png")
    expect(p).toBe("project-logos/abc/file.png")
  })

  it("validates path belongs to id and bucket", () => {
    const path = "collab-logos/xyz/logo.svg"
    expect(pathBelongsToId("collab-logos", "xyz", path)).toBe(true)
    expect(pathBelongsToId("collab-logos", "abc", path)).toBe(false)
    expect(pathBelongsToId("project-logos", "xyz", path)).toBe(false)
  })
})
