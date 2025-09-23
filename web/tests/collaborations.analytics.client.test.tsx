// @vitest-environment jsdom
import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react"

const trackSpy = vi.fn()

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("mode=role"),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))

vi.mock("@/lib/analytics", () => ({ useAnalytics: () => ({ track: trackSpy }) }))
vi.mock("@/hooks/useTags", () => ({ useTags: () => ({ technology: [], category: [], loading: false, error: null }) }))
vi.mock("@/lib/api/collabs", () => ({ listCollabs: vi.fn(async () => ({ items: [] })) }))
vi.mock("@/components/features/projects/filter-bar", () => ({ FilterBar: () => <div /> }))
vi.mock("@/components/ui/badge", () => ({ Badge: ({ children }: any) => <span>{children}</span> }))
vi.mock("@/components/ui/logo-image", () => ({ LogoImage: () => <span>Logo</span> }))
vi.mock("@/components/ui/empty-state", () => ({ EmptyState: () => <div /> }))

vi.mock("@/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder, className, type = "text", onKeyDown, onFocus }: any) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={className} onKeyDown={onKeyDown} onFocus={onFocus} />
  ),
}))

// Mock roles API
const fetchSpy = vi.fn(async () => ({ json: async () => ({ roles: ["AI Engineer"] }) }))
vi.stubGlobal("fetch", fetchSpy as any)

import CollaborationsClient from "@/app/collaborations/CollaborationsClient"

describe("CollaborationsClient analytics (role mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => cleanup())

  it("emits search_performed with search_mode=role and role property", async () => {
    render(<CollaborationsClient />)
    const input = screen.getByPlaceholderText("Search roles...")
    fireEvent.change(input, { target: { value: "AI Engineer" } })
    // Wait until initial loading finishes and the submit button label changes to "Search"
    const submitBtn = await screen.findByRole("button", { name: "Search" })
    fireEvent.click(submitBtn)
    await waitFor(() => expect(trackSpy).toHaveBeenCalled())
    const call = trackSpy.mock.calls.find((c) => c[0] === "search_performed")
    expect(call).toBeTruthy()
    expect(call![1].search_mode).toBe("role")
    expect(call![1].role).toBe("AI Engineer")
  })
})


