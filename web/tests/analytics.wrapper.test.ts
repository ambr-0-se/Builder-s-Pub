import { describe, it, expect, vi } from "vitest"

// Import module under test
import * as analytics from "@/lib/analytics"

describe("analytics wrapper", () => {
  it("normalizes legacy event names to canonical", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    const { useAnalytics } = analytics
    const { track } = useAnalytics()
    track("project_created", { foo: 1 })
    track("filters_applied", { bar: 2 })
    // Allow dynamic import to resolve
    await new Promise((r) => setTimeout(r, 0))
    expect(spy).toHaveBeenCalled()
    const calls = spy.mock.calls.map((args) => String(args[0]))
    expect(calls.some((s) => s.includes("project_create"))).toBe(true)
    expect(calls.some((s) => s.includes("filter_apply"))).toBe(true)
    spy.mockRestore()
  })

  it("trackServer guards against client usage and logs server prefix", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    // Simulate client: define window property in a configurable way
    Object.defineProperty(globalThis, "window", { value: {}, configurable: true, writable: true })
    analytics.trackServer("comment_added", { ok: true })
    expect(warn).toHaveBeenCalled()
    // Cleanup client simulation
    Reflect.deleteProperty(globalThis as Record<string, unknown>, "window")
    analytics.trackServer("comment_added", { ok: true })
    expect(log).toHaveBeenCalled()
    const firstCall = log.mock.calls[0]
    const firstLog = String(firstCall && firstCall[0])
    expect(firstLog.includes("[Analytics][server] comment_added")).toBe(true)
    warn.mockRestore()
    log.mockRestore()
  })
})


