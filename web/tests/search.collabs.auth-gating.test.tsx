// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react"
import React from "react"

// Router/search params mocks with mutable state
const searchParamsMock: { current: URLSearchParams } = { current: new URLSearchParams("") }
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsMock.current,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))

// Avoid remote tags fetch in FilterBar/useTags
vi.mock("@/hooks/useTags", () => ({
  useTags: () => ({ technology: [], category: [], loading: false, error: null }),
}))

// UI primitives simplified
vi.mock("@/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder, className, type = "text" }: any) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={className} />
  ),
}))
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, type = "button", disabled, variant, className, ...rest }: any) => (
    <button onClick={onClick} type={type} disabled={disabled} className={className} data-variant={variant} {...rest}>
      {children}
    </button>
  ),
}))
vi.mock("@/components/ui/empty-state", () => ({
  EmptyState: ({ title, description, action }: any) => (
    <div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  ),
}))
vi.mock("next/link", () => ({ default: ({ href, children }: any) => <a href={href}>{children}</a> }))

// Spy on API calls
const listCollabsSpy = vi.fn()
vi.mock("@/lib/api/collabs", () => ({
  listCollabs: (...args: any[]) => listCollabsSpy(...args),
}))
const listProjectsSpy = vi.fn(async () => ({ items: [] }))
vi.mock("@/lib/api/projects", () => ({
  listProjects: (...args: any[]) => listProjectsSpy(...args),
}))

describe("/search collaborations tab gating", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    // Ensure React is globally available for JSX runtime in this environment
    // @ts-expect-error test setup
    ;(global as any).React = React
    // Reset search params to default
    searchParamsMock.current = new URLSearchParams("")
    // Default API spy return values
    listCollabsSpy.mockResolvedValue({ items: [], nextCursor: undefined })
  })

  afterEach(() => {
    cleanup()
  })

  it("anonymous: switching to Collaborations shows login-required and does NOT call collab API", async () => {
    vi.doMock("@/lib/api/auth", () => ({ useAuth: () => ({ isAuthenticated: false }) }))
    const mod = await import("@/app/search/page")
    const Page = mod.default
    render(<Page />)

    // Start on projects tab; switch to collaborations
    const collabTab = screen.getByRole("button", { name: /collaborations/i })
    fireEvent.click(collabTab)

    // Should show login-required empty state
    await screen.findByRole("heading", { name: /sign in to search collaborations/i })

    // Placeholder changes for anon is the login-required state; ensure API not called
    expect(listCollabsSpy).not.toHaveBeenCalled()

    // Verify CTA link targets sign-in with redirect to collabs search
    const link = screen.getByRole("link", { name: /sign in to search collaborators/i })
    expect(link.getAttribute("href")).toContain("/auth/sign-in?redirectTo=/search?type=collabs")
  })

  it("authenticated: switching to Collaborations updates placeholder and triggers API on search", async () => {
    vi.doMock("@/lib/api/auth", () => ({ useAuth: () => ({ isAuthenticated: true }) }))
    const mod = await import("@/app/search/page")
    const Page = mod.default
    render(<Page />)

    // Switch to collaborations tab
    const collabTab = screen.getByRole("button", { name: /collaborations/i })
    fireEvent.click(collabTab)

    // Placeholder should reflect collaborations context
    const input = screen.getByRole("searchbox") as HTMLInputElement
    expect(input.placeholder.toLowerCase()).toContain("collaborations")

    // Perform explicit search
    const searchBtn = screen.getByRole("button", { name: /^Search$/i })
    fireEvent.click(searchBtn)

    // API should be called (listCollabs) after submit
    await waitFor(() => expect(listCollabsSpy).toHaveBeenCalled())
  })

  it("anonymous: direct load /search?type=collabs shows login-required and no API call", async () => {
    vi.doMock("@/lib/api/auth", () => ({ useAuth: () => ({ isAuthenticated: false }) }))
    // Override search params to include type=collabs
    searchParamsMock.current = new URLSearchParams("type=collabs")

    const mod = await import("@/app/search/page")
    const Page = mod.default
    render(<Page />)

    await screen.findByRole("heading", { name: /sign in to search collaborations/i })
    expect(listCollabsSpy).not.toHaveBeenCalled()
  })
})


