import { describe, it, expect, vi, beforeEach } from "vitest"
import * as React from "react"
import { renderToString } from "react-dom/server"

describe("/collaborations/[id] auth gating", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("renders login-required screen for anonymous users", async () => {
    // Ensure React is available globally for server-side JSX rendering in tests
    // @ts-expect-error test setup
    (global as any).React = React
    // Stub client-side modules to avoid pulling env-dependent imports
    vi.doMock("@/lib/api/auth", () => ({ useAuth: () => ({ isAuthenticated: false }) }))
    vi.doMock("@/lib/supabaseClient", () => ({ supabase: {} }))
    vi.doMock("@/components/features/collaborations/collab-upvote-button", () => ({ CollabUpvoteButton: () => null }))
    vi.doMock("@/components/features/collaborations/collab-comment-form", () => ({ CollabCommentForm: () => null }))
    vi.doMock("@/components/features/collaborations/collab-comment-list", () => ({ CollabCommentList: () => null }))
    vi.doMock("@/components/features/collaborations/hiring-toggle", () => ({ HiringToggle: () => null }))
    vi.doMock("@/lib/supabaseServer", () => ({
      getServerSupabase: vi.fn(async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } })),
    }))
    const mod = await import("@/app/collaborations/[id]/page")
    const Page = mod.default as (props: { params: { id: string } }) => Promise<JSX.Element>
    const el = await Page({ params: { id: "c1" } })
    const html = renderToString(el)
    expect(html).toContain("Sign in to view this collaboration")
    expect(html).toContain("Sign in to view")
  })

  it("renders detail for authenticated users", async () => {
    // @ts-expect-error test setup
    (global as any).React = React
    // Stub client-side modules
    vi.doMock("@/lib/api/auth", () => ({ useAuth: () => ({ isAuthenticated: true, user: { id: "u1" } }) }))
    vi.doMock("@/lib/supabaseClient", () => ({ supabase: {} }))
    vi.doMock("@/components/features/collaborations/collab-upvote-button", () => ({ CollabUpvoteButton: () => null }))
    vi.doMock("@/components/features/collaborations/collab-comment-form", () => ({ CollabCommentForm: () => null }))
    vi.doMock("@/components/features/collaborations/collab-comment-list", () => ({ CollabCommentList: () => null }))
    vi.doMock("@/components/features/collaborations/hiring-toggle", () => ({ HiringToggle: () => null }))
    vi.doMock("@/lib/supabaseServer", () => ({
      getServerSupabase: vi.fn(async () => ({ auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) } })),
    }))
    vi.doMock("@/lib/server/collabs", () => ({
      getCollab: vi.fn(async () => ({
        collaboration: { id: "c1", ownerId: "u1", title: "Alpha", description: "desc", createdAt: new Date(), lookingFor: [] },
        tags: { technology: [], category: [] },
        upvoteCount: 0,
        owner: { userId: "u1", displayName: "User" },
      })),
    }))
    const mod = await import("@/app/collaborations/[id]/page")
    const Page = mod.default as (props: { params: { id: string } }) => Promise<JSX.Element>
    const el = await Page({ params: { id: "c1" } })
    const html = renderToString(el)
    expect(html).toContain("Alpha")
    expect(html).toContain("Project Description")
  })
})


