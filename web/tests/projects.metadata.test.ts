import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/server/projects", () => ({
  getProject: vi.fn(),
}))
// Prevent client auth code (which pulls supabaseClient) from loading env-dependent code during tests
vi.mock("@/lib/api/auth", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}))
vi.mock("@/lib/supabaseClient", () => ({
  supabase: {},
}))

describe("projects/[id] generateMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns Not Found title when project is missing", async () => {
    const { getProject } = await import("@/lib/server/projects") as any
    ;(getProject as any).mockResolvedValueOnce(null)

    const { generateMetadata } = await import("@/app/projects/[id]/page")
    const meta = await generateMetadata({ params: { id: "missing" } } as any)
    expect(meta.title).toBe("Project Not Found - Builder's Pub")
  })

  it("returns enriched metadata when project exists", async () => {
    const { getProject } = await import("@/lib/server/projects") as any
    ;(getProject as any).mockResolvedValueOnce({
      project: {
        id: "p123",
        title: "Awesome App",
        tagline: "Do awesome things",
        description: "desc",
        demoUrl: "https://youtu.be/dQw4w9WgXcQ",
        sourceUrl: null,
        createdAt: new Date(),
      },
      tags: { technology: [], category: [] },
      upvoteCount: 0,
      comments: [],
      owner: { userId: "u1", displayName: "Alice" },
      hasUserUpvoted: false,
    })

    const { generateMetadata } = await import("@/app/projects/[id]/page")
    const meta = await generateMetadata({ params: { id: "p123" } } as any)

    expect(meta.title).toBe("Awesome App - Builder's Pub")
    expect(meta.description).toBe("Do awesome things")
    expect(meta.openGraph?.title).toBe("Awesome App - Builder's Pub")
    expect(meta.openGraph?.description).toBe("Do awesome things")
    expect(meta.openGraph?.type).toBe("article")
    expect((meta.openGraph as any)?.siteName).toBe("Builder's Pub")
    expect((meta.openGraph as any)?.url).toContain("/projects/p123")
    expect(meta.twitter?.card).toBe("summary_large_image")
    expect(meta.twitter?.title).toBe("Awesome App - Builder's Pub")
  })
})


