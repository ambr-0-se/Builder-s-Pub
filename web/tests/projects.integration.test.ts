import { describe, it, expect, vi } from "vitest"

// We will smoke test validation and shape mapping for list/get helpers

describe("Projects core (Stage 5)", () => {
	it("validates project schema constraints (client mirror)", async () => {
		const { createProjectSchema } = await import("@/app/projects/schema")

		const ok = createProjectSchema.safeParse({
			title: "A",
			tagline: "B",
			description: "C",
			demoUrl: "https://example.com",
			sourceUrl: "",
			techTagIds: [1],
			categoryTagIds: [2],
		})
		expect(ok.success).toBe(true)

		const bad = createProjectSchema.safeParse({
			title: "",
			tagline: "",
			description: "",
			demoUrl: "not-a-url",
			sourceUrl: "ftp://nope",
			techTagIds: [],
			categoryTagIds: [],
		})
		expect(bad.success).toBe(false)
	})

	it("listProjects client wrapper converts createdAt to Date", async () => {
		vi.stubGlobal("fetch", vi.fn(async () => ({
			ok: true,
			json: async () => ({
				items: [
					{
						project: {
							id: "p1",
							ownerId: "u1",
							title: "T",
							tagline: "tag",
							description: "desc",
							demoUrl: "https://demo",
							createdAt: new Date("2024-01-01").toISOString(),
						},
						tags: { technology: [], category: [] },
						upvoteCount: 0,
						comments: [],
						owner: { userId: "u1", displayName: "User" },
					},
				],
				nextCursor: undefined,
			}),
		}) as any))

		const { listProjects } = await import("@/lib/api/projects")
		const { items } = await listProjects({})
		expect(items[0].project.createdAt instanceof Date).toBe(true)
	})
})


