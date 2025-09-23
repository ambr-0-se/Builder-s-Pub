// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import React from "react"

const replaceMock = vi.fn()
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("mode=project"),
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
}))

vi.mock("@/lib/analytics", () => ({ useAnalytics: () => ({ track: vi.fn() }) }))

vi.mock("@/lib/api/collabs", () => ({
  listCollabs: vi.fn(async () => ({ items: [] })),
}))

vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ roles: [] }) })) as any)

vi.mock("@/components/ui/badge", () => ({ Badge: ({ children }: any) => <span>{children}</span> }))
vi.mock("@/components/ui/logo-image", () => ({ LogoImage: () => <span>Logo</span> }))
vi.mock("@/components/ui/empty-state", () => ({ EmptyState: () => <div /> }))
vi.mock("@/components/features/projects/filter-bar", () => ({ FilterBar: () => <div /> }))
vi.mock("@/components/ui/input", () => ({ Input: (p: any) => <input {...p} /> }))

import CollaborationsClient from "@/app/collaborations/CollaborationsClient"

describe("CollaborationsClient mode toggle", () => {
  beforeEach(() => { vi.clearAllMocks(); replaceMock.mockClear() })
  afterEach(() => cleanup())

  it("clicking By role sets mode=role via router.replace", async () => {
    render(<CollaborationsClient />)
    const byRole = screen.getByRole("button", { name: /by role/i })
    fireEvent.click(byRole)
    await waitFor(() => expect(replaceMock).toHaveBeenCalled())
    const url = String(replaceMock.mock.calls[0][0])
    expect(url).toContain("mode=role")
  })
})


