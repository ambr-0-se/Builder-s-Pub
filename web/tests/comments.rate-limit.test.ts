import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock server supabase with simple in-memory counter for rate_limits
const windowKey = (action: string, user: string, start: string) => `${action}:${user}:${start}`
const store: Record<string, number> = {}

vi.mock("@/lib/supabaseServer", () => ({
	getServerSupabase: vi.fn(async () => ({
		auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
		from: vi.fn().mockImplementation((table: string) => {
			if (table === "rate_limits") {
				return {
					select: vi.fn().mockImplementation(() => {
						const where: Record<string, string> = {}
						const chain: any = {
							eq: vi.fn().mockImplementation((col: string, val: string) => {
								where[col] = val
								return chain
							}),
							maybeSingle: vi.fn(async () => {
								const key = `${where["action"]}:${where["user_id"]}:${where["window_start"]}`
								const count = store[key]
								return count !== undefined ? { data: { count } as any, error: null } : { data: null as any, error: null }
							}),
						}
						return chain
					}),
					upsert: vi.fn().mockImplementation(async (row: any) => {
						const key = windowKey(row.action, row.user_id, row.window_start)
						store[key] = row.count
						return { error: null }
					}),
				}
			}
			if (table === "comments") {
				return {
					insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn(async () => ({ data: { id: `c${Math.random()}` } })) }) }),
				}
			}
			return { select: vi.fn() }
		}),
	})),
}))

describe("rate limits", () => {
	beforeEach(() => {
		for (const k of Object.keys(store)) delete store[k]
	})

	it("limits addComment to 5 per minute", async () => {
		const { addComment } = await import("@/lib/server/projects")
		// Five should pass
		for (let i = 0; i < 5; i++) {
			const res = await addComment("p1", "hello")
			expect("id" in (res as any)).toBe(true)
		}
		// Sixth should hit rate limit
		const blocked = await addComment("p1", "hello")
		expect((blocked as any).error).toBe("rate_limited")
	})
})


