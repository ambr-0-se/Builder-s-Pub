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

	it("listProjects ranks q matches: title > tagline > description", async () => {
		const { listProjects } = await import("@/lib/server/projects")
		const supa = await import("@supabase/supabase-js") as any
		// Override createClient for this test to return predictable rows
		;(supa.createClient as any).mockImplementationOnce(() => ({
			from: (table: string) => {
				if (table === "projects") {
					return {
						select: () => ({
							eq: () => ({
								order: () => ({
									limit: async () => ({
										data: [
											{ id: "p1", owner_id: "u1", title: "React App", tagline: "t", description: "d", demo_url: "", source_url: null, created_at: new Date().toISOString() },
											{ id: "p2", owner_id: "u1", title: "x", tagline: "React tagline", description: "d", demo_url: "", source_url: null, created_at: new Date().toISOString() },
											{ id: "p3", owner_id: "u1", title: "x", tagline: "t", description: "React description", demo_url: "", source_url: null, created_at: new Date().toISOString() },
										],
										error: null,
									}),
								}),
							}),
						})
					}
				}
				// default chains used by helpers
				return {
					select: () => ({
						in: () => ({ data: [], error: null }),
					}),
					in: () => ({ select: () => ({ data: [], error: null }) }),
				}
			},
		}))
		const res = await listProjects({ q: "react", limit: 3 })
		const ids = res.items.map((i) => i.project.id)
		expect(ids).toEqual(["p1", "p2", "p3"])
	})
})


