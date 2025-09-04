import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/server/projects", () => ({
  listProjects: vi.fn(async () => ({ items: [{ project: { id: "p1", createdAt: new Date() } }] })),
}))
vi.mock("@/lib/server/collabs", () => ({
  listCollabs: vi.fn(async () => ({ items: [{ collaboration: { id: "c1", createdAt: new Date() } }] })),
}))

describe("sitemap.xml route", () => {
  it("includes core pages and items", async () => {
    const mod = await import("@/app/sitemap.xml/route")
    const res = await mod.GET()
    const xml = await (res as any).text()
    expect(xml).toContain("<loc>https://builders.pub/</loc>")
    expect(xml).toContain("<loc>https://builders.pub/projects</loc>")
    expect(xml).toContain("<loc>https://builders.pub/collaborations</loc>")
    expect(xml).toContain("<loc>https://builders.pub/search</loc>")
    expect(xml).toContain("/projects/p1")
    expect(xml).toContain("/collaborations/c1")
  })
})


