// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import React from "react"

// Provide mode=role via URLSearchParams mock
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("mode=role"),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))

vi.mock("@/lib/analytics", () => ({ useAnalytics: () => ({ track: vi.fn() }) }))

// Mock roles API
const fetchSpy = vi.fn(async () => ({ json: async () => ({ roles: ["AI Engineer", "Agent Engineer", "Backend Engineer"] }) }))
vi.stubGlobal("fetch", fetchSpy as any)

// Avoid Supabase client usage in nested hooks that might be imported indirectly
vi.mock("@/hooks/useTags", () => ({ useTags: () => ({ technology: [], category: [], loading: false, error: null }) }))

vi.mock("@/lib/api/collabs", () => ({
  listCollabs: vi.fn(async () => ({ items: [] })),
}))

// Lightweight UI mocks
vi.mock("@/components/ui/badge", () => ({ Badge: ({ children }: any) => <span>{children}</span> }))
vi.mock("@/components/ui/logo-image", () => ({ LogoImage: () => <span>Logo</span> }))
vi.mock("@/components/features/projects/filter-bar", () => ({ FilterBar: () => <div /> }))
vi.mock("@/components/ui/empty-state", () => ({ EmptyState: () => <div /> }))

// Mock Input to avoid forwardRef complexity
vi.mock("@/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder, className, type = "text", onKeyDown, onFocus }: any) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={className} onKeyDown={onKeyDown} onFocus={onFocus} />
  ),
}))

import CollaborationsClient from "@/app/collaborations/CollaborationsClient"

describe("CollaborationsClient role suggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("shows suggestions on focus and filters by input", async () => {
    render(<CollaborationsClient />)
    const input = screen.getByPlaceholderText("Search roles...")
    fireEvent.focus(input)
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    expect(await screen.findByText("AI Engineer")).toBeTruthy()

    fireEvent.change(input, { target: { value: "Agent" } })
    expect(await screen.findByText("Agent Engineer")).toBeTruthy()
    expect(screen.queryByText("Backend Engineer")).toBeNull()
  })

  it("allows keyboard selection with Enter", async () => {
    render(<CollaborationsClient />)
    const input = screen.getByPlaceholderText("Search roles...")
    fireEvent.focus(input)
    await screen.findByText("AI Engineer")
    fireEvent.keyDown(input, { key: "ArrowDown" })
    fireEvent.keyDown(input, { key: "Enter" })
    expect((input as HTMLInputElement).value.length).toBeGreaterThan(0)
  })
})


