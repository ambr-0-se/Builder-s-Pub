// @vitest-environment jsdom
import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"

const replaceSpy = vi.fn()

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("mode=role"),
  useRouter: () => ({ replace: replaceSpy, push: vi.fn() }),
}))

vi.mock("@/lib/analytics", () => ({ useAnalytics: () => ({ track: vi.fn() }) }))
vi.mock("@/hooks/useTags", () => ({ useTags: () => ({ technology: [], category: [], loading: false, error: null }) }))
vi.mock("@/lib/api/collabs", () => ({ listCollabs: vi.fn(async () => ({ items: [{ collaboration: { id: "c1", title: "Alpha", description: "d", createdAt: new Date(), lookingFor: [] }, owner: { displayName: "u" }, upvoteCount: 0 }] })) }))
vi.mock("@/components/features/projects/filter-bar", () => ({ FilterBar: () => <div /> }))
vi.mock("@/components/ui/badge", () => ({ Badge: ({ children }: any) => <span>{children}</span> }))
vi.mock("@/components/ui/logo-image", () => ({ LogoImage: () => <span>Logo</span> }))
vi.mock("@/components/ui/empty-state", () => ({ EmptyState: () => <div /> }))
vi.mock("@/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder, className, type = "text", onKeyDown, onFocus }: any) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={className} onKeyDown={onKeyDown} onFocus={onFocus} />
  ),
}))

// minimal fetch for detail panel
vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ item: { collaboration: { id: "c1", title: "Alpha", description: "d", lookingFor: [], createdAt: new Date().toISOString() }, owner: { displayName: "u" } } }) })) as any)

import CollaborationsClient from "@/app/collaborations/CollaborationsClient"

describe("CollaborationsClient split view scroll preservation", () => {
  beforeEach(() => replaceSpy.mockClear())
  afterEach(() => cleanup())

  it("uses router.replace with scroll:false on selection", async () => {
    render(<CollaborationsClient />)
    const titleNode = await screen.findByText("Alpha")
    const cardBtn = titleNode.closest("button") as HTMLButtonElement
    fireEvent.click(cardBtn)
    const call = replaceSpy.mock.calls.find((c) => c[0].startsWith("/collaborations?"))
    expect(call).toBeTruthy()
    expect(call![1]).toEqual({ scroll: false })
  })
})


