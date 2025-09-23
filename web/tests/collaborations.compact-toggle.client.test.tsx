// @vitest-environment jsdom
import React from "react"
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import CollaborationsClient from "@/app/collaborations/CollaborationsClient"

// Mock dependencies
vi.mock("@/lib/api/collabs", () => ({
  listCollabs: vi.fn().mockResolvedValue({ items: [] }),
  fetchCollab: vi.fn().mockResolvedValue(null),
}))

const mockRouter = { replace: vi.fn() }
const mockTrack = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}))

vi.mock("@/lib/analytics", () => ({
  useAnalytics: () => ({
    track: mockTrack,
  }),
}))

vi.mock("@/hooks/useTags", () => ({
  useTags: () => ({
    technology: [],
    category: [],
    loading: false,
  }),
}))

vi.mock("@/components/ui/input", () => ({
  Input: ({ placeholder, ...props }: any) => (
    <input data-testid="search-input" placeholder={placeholder} {...props} />
  ),
}))

vi.mock("@/components/features/projects/filter-bar", () => ({
  FilterBar: (_props: any) => <div data-testid="filter-bar" />,
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, "aria-pressed": ariaPressed, asChild, ...props }: any) => {
    if (asChild) {
      // When asChild is true, just render the children directly (like Radix does)
      return children
    }
    return (
      <button
        onClick={onClick}
        data-variant={variant}
        data-pressed={ariaPressed}
        {...props}
      >
        {children}
      </button>
    )
  },
}))

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}))

vi.mock("@/components/ui/logo-image", () => ({
  LogoImage: () => <div data-testid="logo" />,
}))

vi.mock("@/components/ui/empty-state", () => ({
  EmptyState: () => <div data-testid="empty-state">No collaborations found</div>,
}))

describe("CollaborationsClient compact toggle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouter.replace.mockClear()
    mockTrack.mockClear()
    mockSearchParams = new URLSearchParams() // Reset to default (project mode)
  })

  afterEach(() => {
    cleanup()
  })

  it("renders compact segmented control with correct initial state", () => {
    render(<CollaborationsClient initialCollabs={[]} />)
    
    const toggle = screen.getAllByTestId("mode-toggle")[0]
    const projectButton = within(toggle).getByText("By project")
    const roleButton = within(toggle).getByText("By role")
    
    expect(projectButton).toBeTruthy()
    expect(roleButton).toBeTruthy()
    
    // Project mode should be selected by default
    expect(projectButton.getAttribute("data-pressed")).toBe("true")
    expect(roleButton.getAttribute("data-pressed")).toBe("false")
    
    // Check variants (selected vs unselected)
    expect(projectButton.getAttribute("data-variant")).toBe("default")
    expect(roleButton.getAttribute("data-variant")).toBe("ghost")
  })

  it("updates URL and analytics when clicking role toggle", () => {
    render(<CollaborationsClient initialCollabs={[]} />)
    const toggle = screen.getAllByTestId("mode-toggle")[0]
    const roleButton = within(toggle).getByText("By role")
    fireEvent.click(roleButton)
    
    // Should call router.replace with mode=role
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining("mode=role")
    )
    
    // Should track search_mode_change event
    expect(mockTrack).toHaveBeenCalledWith("search_mode_change", {
      from: "project",
      to: "role",
      type: "collabs",
      techTagIds: [],
      categoryTagIds: [],
      stages: [],
      projectTypes: [],
    })
  })

  it("updates URL and analytics when clicking project toggle", () => {
    // Start with role mode
    mockSearchParams = new URLSearchParams("mode=role")
    
    render(<CollaborationsClient initialCollabs={[]} />)
    
    const toggle = screen.getAllByTestId("mode-toggle")[0]
    const projectButton = within(toggle).getByText("By project")
    fireEvent.click(projectButton)
    
    // Should call router.replace with mode=project
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining("mode=project")
    )
    
    // Should track search_mode_change event (validate target mode)
    expect(mockTrack).toHaveBeenCalledWith(
      "search_mode_change",
      expect.objectContaining({ to: "project", type: "collabs" })
    )
  })

  it("shows correct placeholder text based on mode", () => {
    // Test project mode (default)
    mockSearchParams = new URLSearchParams()
    const { rerender } = render(<CollaborationsClient initialCollabs={[]} />)
    let placeholders = screen.getAllByTestId("search-input").map((el) => el.getAttribute("placeholder"))
    expect(placeholders.includes("Search collaborations...")).toBeTruthy()
    
    // Test role mode
    mockSearchParams = new URLSearchParams("mode=role")
    
    rerender(<CollaborationsClient initialCollabs={[]} />)
    placeholders = screen.getAllByTestId("search-input").map((el) => el.getAttribute("placeholder"))
    expect(placeholders.includes("Search roles...")).toBeTruthy()
  })

  it("removes selected collaboration when switching modes", () => {
    // Start with a selected collaboration in role mode
    mockSearchParams = new URLSearchParams("mode=role&selected=test-id")
    
    render(<CollaborationsClient initialCollabs={[]} />)
    
    const toggle = screen.getAllByTestId("mode-toggle")[0]
    const projectButton = within(toggle).getByText("By project")
    fireEvent.click(projectButton)
    
    // Should remove the selected parameter
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.not.stringContaining("selected=test-id")
    )
  })
})
