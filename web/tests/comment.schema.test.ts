import { describe, it, expect } from "vitest"

describe("commentSchema", () => {
	it("accepts 1-1000 chars and trims whitespace", async () => {
		const { commentSchema } = await import("@/app/projects/schema")
		const ok = commentSchema.safeParse({ body: "  hello world  " })
		expect(ok.success).toBe(true)
	})

	it("rejects empty or overlong comments", async () => {
		const { commentSchema } = await import("@/app/projects/schema")
		const empty = commentSchema.safeParse({ body: "   " })
		expect(empty.success).toBe(false)
		const long = commentSchema.safeParse({ body: "x".repeat(1001) })
		expect(long.success).toBe(false)
	})
})


