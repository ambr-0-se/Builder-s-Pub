import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock server supabase and supabase-js createClient
vi.mock("@/lib/supabaseServer", () => ({
	getServerSupabase: vi.fn(async () => ({
		auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
		from: vi.fn().mockImplementation((table: string) => ({
			insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn(async () => ({ data: { id: "p1" } })) }) }),
			delete: vi.fn().mockReturnValue({ eq: vi.fn(async () => ({}) ) }),
		})),
	}))
}))

vi.mock("@supabase/supabase-js", () => ({
	createClient: vi.fn(() => ({
		from: vi.fn().mockImplementation((table: string) => ({
			select: vi.fn().mockReturnValue({ in: vi.fn().mockReturnValue({ data: [], error: null }) }),
			in: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ data: [], error: null }) }),
		})),
	})),
}))

describe("server projects", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("createProject returns id for valid input", async () => {
		const { createProject } = await import("@/lib/server/projects")
		const res = await createProject({
			title: "A title",
			tagline: "Tagline",
			description: "Some description",
			demoUrl: "https://example.com",
			sourceUrl: "",
			techTagIds: [1],
			categoryTagIds: [2],
		})
		expect("id" in (res as any)).toBe(true)
	})

	it("createProject rejects when unauthorized", async () => {
		const { getServerSupabase } = await import("@/lib/supabaseServer")
		;(getServerSupabase as any).mockResolvedValueOnce({ auth: { getUser: async () => ({ data: { user: null } }) } })
		const { createProject } = await import("@/lib/server/projects")
		const res = await createProject({
			title: "A",
			tagline: "B",
			description: "C",
			demoUrl: "https://example.com",
			sourceUrl: "",
			techTagIds: [1],
			categoryTagIds: [2],
		})
		expect(res).toEqual({ formError: "unauthorized" })
	})
})


