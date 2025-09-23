// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import React from "react"

vi.mock("@/lib/api/collabs", () => {
  return {
    listCollabs: vi.fn(async () => {
      return {
        items: [
          {
            collaboration: {
              id: "c1",
              title: "Test Collab",
              description: "Build something great",
              createdAt: new Date(),
              lookingFor: [{ role: "Frontend Engineer" }],
            },
            owner: { displayName: "Alice" },
            upvoteCount: 3,
          },
        ],
      }
    }),
  }
})

// Lightweight UI mocks to avoid unrelated rendering issues
vi.mock("@/components/ui/badge", () => {
  return {
    Badge: ({ children }: any) => <span>{children}</span>,
  }
})

vi.mock("@/components/ui/logo-image", () => {
  return {
    LogoImage: () => <span>Logo</span>,
  }
})

// Avoid real Supabase fetch in FilterBar/useTags
vi.mock("@/hooks/useTags", () => {
  return {
    useTags: () => ({ technology: [], category: [], loading: false, error: null }),
  }
})

vi.mock("@/components/features/projects/filter-bar", () => {
  return {
    FilterBar: ({ onClear }: any) => (
      <div>
        <button onClick={() => onClear && onClear()}>Clear All</button>
      </div>
    ),
  }
})

// Mock Input to avoid forwardRef/React import issues in jsdom
vi.mock("@/components/ui/input", () => {
  return {
    Input: ({ value, onChange, placeholder, className, type = "text" }: any) => (
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={className} />
    ),
  }
})

import CollaborationsClient from "@/app/collaborations/CollaborationsClient"

describe("CollaborationsClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("renders loading state then list", async () => {
    render(<CollaborationsClient />)
    expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0)
    await screen.findByRole("heading", { name: "Test Collab" })
    expect(screen.getByText("Collaborations")).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Test Collab" })).toBeTruthy()
    expect(screen.getByText(/Frontend Engineer/i)).toBeTruthy()
  })
})


