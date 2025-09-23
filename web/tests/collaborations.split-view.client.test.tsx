// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import React from "react"

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("mode=role"),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))

vi.mock("@/lib/analytics", () => ({ useAnalytics: () => ({ track: vi.fn() }) }))

vi.mock("@/lib/api/collabs", () => ({
  listCollabs: vi.fn(async () => ({
    items: [
      { collaboration: { id: "c1", title: "Alpha", description: "", createdAt: new Date(), lookingFor: [{ role: "Backend Engineer" }] }, owner: { displayName: "A" }, upvoteCount: 0 },
      { collaboration: { id: "c2", title: "Beta", description: "", createdAt: new Date(), lookingFor: [{ role: "AI Engineer" }] }, owner: { displayName: "B" }, upvoteCount: 0 },
    ],
  })),
}))

vi.stubGlobal("fetch", vi.fn(async (url: string) => {
  const u = new URL(url, "http://localhost")
  if (u.pathname === "/api/collaborations/get" && u.searchParams.get("id") === "c2") {
    return { ok: true, json: async () => ({ item: { collaboration: { id: "c2", title: "Beta", description: "Detail", lookingFor: [{ role: "AI Engineer" }] }, owner: { displayName: "B" } } }) } as any
  }
  return { ok: false, json: async () => ({}) } as any
}) as any)

vi.mock("@/components/ui/badge", () => ({ Badge: ({ children }: any) => <span>{children}</span> }))
vi.mock("@/components/ui/logo-image", () => ({ LogoImage: () => <span>Logo</span> }))
vi.mock("@/components/ui/empty-state", () => ({ EmptyState: () => <div /> }))
vi.mock("@/components/features/projects/filter-bar", () => ({ FilterBar: () => <div /> }))
vi.mock("@/components/ui/input", () => ({ Input: (p: any) => <input {...p} /> }))

import CollaborationsClient from "@/app/collaborations/CollaborationsClient"

describe("CollaborationsClient split view (role mode)", () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it("selecting a left item loads detail on the right", async () => {
    render(<CollaborationsClient />)
    // Left list buttons should render with role labels
    await screen.findByText("Backend Engineer")
    fireEvent.click(screen.getByText("AI Engineer"))
    await waitFor(() => expect(screen.getByText("Beta")).toBeTruthy())
  })

  it("restores selected detail via deep link on initial load", async () => {
    // Override useSearchParams to include selected=c2
    const nav = await import("next/navigation")
    vi.spyOn(nav, "useSearchParams").mockReturnValue(new URLSearchParams("mode=role&selected=c2") as any)
    render(<CollaborationsClient />)
    // Should load detail for c2 without interaction (assert on detail header)
    await waitFor(() => expect(screen.getAllByText("Beta").length).toBeGreaterThan(0))
    // Verify the detail area contains the title element
    const headers = screen.getAllByRole("heading", { name: "Beta" })
    expect(headers.length).toBeGreaterThan(0)
  })
})


