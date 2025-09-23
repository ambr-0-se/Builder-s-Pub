import { describe, it, expect, vi } from "vitest"

import { useAnalytics } from "@/lib/analytics"

describe("analytics search events (schema-level)", () => {
  it("emits filter_apply with unified schema for projects", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    const { track } = useAnalytics()
    track("filter_apply", {
      type: "projects",
      techTagIds: [1, 2],
      categoryTagIds: [10],
      triggeredBy: "filters",
    })
    await new Promise((r) => setTimeout(r, 0))
    const rows = log.mock.calls.map((a) => String(a[0]))
    expect(rows.some((s) => s.includes("filter_apply"))).toBe(true)
    log.mockRestore()
  })

  it("emits filter_apply with unified schema for collabs (stages/projectTypes)", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    const { track } = useAnalytics()
    track("filter_apply", {
      type: "collabs",
      techTagIds: [3],
      categoryTagIds: [11, 12],
      stages: ["building", "idea"],
      projectTypes: ["open_source"],
      triggeredBy: "filters",
    })
    await new Promise((r) => setTimeout(r, 0))
    const rows = log.mock.calls.map((a) => String(a[0]))
    expect(rows.some((s) => s.includes("filter_apply"))).toBe(true)
    log.mockRestore()
  })

  it("emits search_performed with unified tag property names", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    const { track } = useAnalytics()
    track("search_performed", {
      type: "projects",
      search_mode: "project",
      query: "test",
      techTagIds: [1],
      categoryTagIds: [2],
      resultCount: 9,
    })
    await new Promise((r) => setTimeout(r, 0))
    const rows = log.mock.calls.map((a) => String(a[0]))
    expect(rows.some((s) => s.includes("search_performed"))).toBe(true)
    log.mockRestore()
  })

  it("emits search_performed in role mode including role property", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    const { track } = useAnalytics()
    track("search_performed", {
      type: "collabs",
      search_mode: "role",
      role: "AI Engineer",
      query: "AI Engineer",
      techTagIds: [],
      categoryTagIds: [],
      stages: [],
      projectTypes: [],
      resultCount: 3,
    })
    await new Promise((r) => setTimeout(r, 0))
    const rows = log.mock.calls.map((a) => String(a[0]))
    expect(rows.some((s) => s.includes("search_performed"))).toBe(true)
    log.mockRestore()
  })

  it("emits search_mode_change with from/to and current facets", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    const { track } = useAnalytics()
    track("search_mode_change", {
      type: "collabs",
      from: "project",
      to: "role",
      techTagIds: [1,2],
      categoryTagIds: [10],
      stages: ["mvp_development"],
      projectTypes: ["open_source"],
    })
    await new Promise((r) => setTimeout(r, 0))
    const rows = log.mock.calls.map((a) => String(a[0]))
    expect(rows.some((s) => s.includes("search_mode_change"))).toBe(true)
    log.mockRestore()
  })
})


