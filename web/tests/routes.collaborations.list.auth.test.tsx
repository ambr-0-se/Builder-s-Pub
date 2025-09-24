import { describe, it, expect, vi, beforeEach } from "vitest"
import * as React from "react"
import { renderToString } from "react-dom/server"

describe("/collaborations list page auth gating", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("renders login-required screen for anonymous users", async () => {
    // Ensure React is available globally for server-side JSX rendering in tests
    // @ts-expect-error test setup
    ;(global as any).React = React

    // Mock server session as anonymous
    vi.doMock("@/lib/supabaseServer", () => ({
      getServerSupabase: vi.fn(async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } })),
    }))

    // Mock client to ensure it is NOT rendered for anon
    const clientSpy = vi.fn(() => null)
    vi.doMock("@/app/collaborations/CollaborationsClient", () => ({ default: clientSpy }))

    const mod = await import("@/app/collaborations/page")
    const Page = mod.default as () => Promise<JSX.Element>
    const el = await Page()
    const html = renderToString(el)

    expect(html).toContain("Sign in to find collaborators")
    expect(html).toContain("/auth/sign-in?redirectTo=/collaborations")
    expect(clientSpy).not.toHaveBeenCalled()
  })

  it("renders list client for authenticated users", async () => {
    // @ts-expect-error test setup
    ;(global as any).React = React

    // Mock server session as authenticated
    vi.doMock("@/lib/supabaseServer", () => ({
      getServerSupabase: vi.fn(async () => ({ auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) } })),
    }))

    // Mock client component to confirm invocation
    const clientSpy = vi.fn(() => React.createElement("div", null, "CLIENT"))
    vi.doMock("@/app/collaborations/CollaborationsClient", () => ({ default: clientSpy }))

    const mod = await import("@/app/collaborations/page")
    const Page = mod.default as () => Promise<JSX.Element>
    const el = await Page()
    const html = renderToString(el)

    expect(clientSpy).toHaveBeenCalledTimes(1)
    expect(html).toContain("CLIENT")
  })
})


