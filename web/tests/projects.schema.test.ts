import { describe, it, expect } from "vitest"

describe("createProjectSchema", () => {
	it("accepts valid minimal payload", async () => {
		const { createProjectSchema } = await import("@/app/projects/schema")
		const result = createProjectSchema.safeParse({
			title: "A title",
			tagline: "Tagline",
			description: "Some description",
			demoUrl: "https://example.com",
			sourceUrl: "",
			techTagIds: [1],
			categoryTagIds: [2],
		})
		expect(result.success).toBe(true)
	})

	it("rejects missing required fields", async () => {
		const { createProjectSchema } = await import("@/app/projects/schema")
		const { success, error } = createProjectSchema.safeParse({
			title: "",
			tagline: "",
			description: "",
			demoUrl: "",
			sourceUrl: "",
			techTagIds: [],
			categoryTagIds: [],
		})
		expect(success).toBe(false)
		expect(error?.issues.map((i) => i.path[0])).toEqual(
			expect.arrayContaining(["title", "tagline", "description", "demoUrl", "techTagIds", "categoryTagIds"]) as any
		)
	})

	it("enforces URL and length constraints", async () => {
		const { createProjectSchema } = await import("@/app/projects/schema")
		const { success, error } = createProjectSchema.safeParse({
			title: "x".repeat(161),
			tagline: "y".repeat(141),
			description: "z".repeat(4001),
			demoUrl: "ftp://nope",
			sourceUrl: "not-a-url",
			techTagIds: [1],
			categoryTagIds: [2],
		})
		expect(success).toBe(false)
		const fields = (error?.issues || []).map((i) => i.path[0])
		expect(fields).toEqual(expect.arrayContaining(["title", "tagline", "description", "demoUrl", "sourceUrl"]))
	})
})


