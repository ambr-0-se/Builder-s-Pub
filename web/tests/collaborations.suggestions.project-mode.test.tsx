// @vitest-environment jsdom
import React from "react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("mode=project"),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))

vi.mock("@/lib/analytics", () => ({ useAnalytics: () => ({ track: vi.fn() }) }))
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

// Ensure fetch isn't relied upon in project mode role suggestions
const fetchSpy = vi.fn(async () => ({ json: async () => ({ roles: ["AI Engineer"] }) }))
vi.stubGlobal("fetch", fetchSpy as any)

import CollaborationsClient from "@/app/collaborations/CollaborationsClient"

describe("CollaborationsClient project mode (no role suggestions)", () => {
  afterEach(() => cleanup())
  it("does not show role suggestions in project mode", async () => {
    render(<CollaborationsClient />)
    const input = screen.getByPlaceholderText("Search collaborations...")
    fireEvent.focus(input)
    // No suggestions dropdown text should appear
    expect(screen.queryByText("Suggestions")).toBeNull()
  })
})


