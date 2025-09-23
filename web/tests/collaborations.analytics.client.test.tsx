// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import React from "react"

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))

// Track spy shared with the mock
const trackMock = vi.fn()

vi.mock("@/lib/analytics", () => {
  return {
    useAnalytics: () => ({ track: trackMock }),
  }
})

vi.mock("@/lib/api/collabs", () => {
  return {
    listCollabs: vi.fn(async () => {
      return {
        items: [
          {
            collaboration: {
              id: "c1",
              title: "LLM Agent Platform",
              description: "Looking for agent engineers",
              createdAt: new Date(),
              lookingFor: [{ role: "Agent Engineer" }],
            },
            owner: { displayName: "Alice" },
            upvoteCount: 10,
          },
        ],
      }
    }),
  }
})

// Make FilterBar interactive to trigger filter changes
vi.mock("@/components/features/projects/filter-bar", () => {
  return {
    FilterBar: ({ onTechTagsChange, onStagesChange, onProjectTypesChange, onClear }: any) => (
      <div>
        <button onClick={() => onTechTagsChange && onTechTagsChange([1])}>Add Tech Tag 1</button>
        <button onClick={() => onStagesChange && onStagesChange(["building"])}>Stage: Building</button>
        <button onClick={() => onProjectTypesChange && onProjectTypesChange(["open_source"])}>Type: Open Source</button>
        <button onClick={() => onClear && onClear()}>Clear All</button>
      </div>
    ),
  }
})

// Mock Input to avoid ref issues
vi.mock("@/components/ui/input", () => {
  return {
    Input: ({ value, onChange, placeholder, className, type = "text" }: any) => (
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={className} />
    ),
  }
})

// Lightweight UI mocks
vi.mock("@/components/ui/badge", () => ({ Badge: ({ children }: any) => <span>{children}</span> }))
vi.mock("@/components/ui/logo-image", () => ({ LogoImage: () => <span>Logo</span> }))

import CollaborationsClient from "@/app/collaborations/CollaborationsClient"

describe("CollaborationsClient analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("emits search_performed on submit with project mode schema", async () => {
    render(<CollaborationsClient />)

    const input = await screen.findByPlaceholderText("Search collaborations...")
    fireEvent.change(input, { target: { value: "agent" } })

    const button = screen.getByRole("button", { name: /search/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(trackMock).toHaveBeenCalled()
    })

    const [event, props] = trackMock.mock.lastCall as any
    expect(event).toBe("search_performed")
    expect(props.type).toBe("collabs")
    expect(props.search_mode).toBe("project")
    expect(props.query).toBe("agent")
    expect(typeof props.resultCount).toBe("number")
  })

  it("emits filter_apply after filters change post-search", async () => {
    render(<CollaborationsClient />)

    // Perform initial search to enable filter_apply
    const input = await screen.findByPlaceholderText("Search collaborations...")
    fireEvent.change(input, { target: { value: "ai" } })
    fireEvent.click(screen.getByRole("button", { name: /search/i }))

    // Trigger a filter change (tech tag)
    fireEvent.click(await screen.findByText("Add Tech Tag 1"))

    await waitFor(() => {
      // filter_apply should be called at least once after the initial search
      expect(trackMock.mock.calls.some(([e]: any[]) => e === "filter_apply")).toBe(true)
    })

    const lastFilterApply = [...trackMock.mock.calls].reverse().find(([e]: any[]) => e === "filter_apply") as any
    const [, props] = lastFilterApply
    expect(props.type).toBe("collabs")
    expect(props.search_mode).toBe("project")
    expect(props.techTagIds).toEqual([1])
    expect(props.triggeredBy).toBe("filters")
  })
})


