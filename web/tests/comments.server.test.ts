import { describe, it, expect, vi, beforeEach } from "vitest"

const rlStore: Record<string, number> = {}

vi.mock("@/lib/supabaseServer", () => ({
	getServerSupabase: vi.fn(async () => ({
		auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
		from: vi.fn().mockImplementation((table: string) => {
			if (table === "comments") {
				return {
					insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn(async () => ({ data: { id: "c1" } })) }) }),
					delete: vi.fn().mockReturnValue({ eq: vi.fn(async () => ({}) ) }),
					select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn(async () => ({ data: { project_id: "p1", parent_comment_id: null, soft_deleted: false } }) ) }) }),
				}
			}
			if (table === "project_upvotes" || table === "comment_upvotes") {
				const selectChain = {
					eq: vi.fn().mockImplementation(() => ({
						eq: vi.fn().mockImplementation(() => ({
							maybeSingle: vi.fn(async () => ({ data: null, error: null })),
						})),
					})),
				}
				return {
					select: vi.fn().mockReturnValue(selectChain),
					delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn(async () => ({}) ) }) }),
					insert: vi.fn(async () => ({ error: null })),
				}
			}
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
                                const count = rlStore[key]
                                return count !== undefined ? { data: { count } as any, error: null } : { data: null as any, error: null }
                            }),
                        }
                        return chain
                    }),
                    upsert: vi.fn().mockImplementation(async (row: any) => {
                        const key = `${row.action}:${row.user_id}:${row.window_start}`
                        rlStore[key] = row.count
                        return { error: null }
                    }),
                }
            }
			return { select: vi.fn(), insert: vi.fn(), delete: vi.fn() }
		}),
	})),
}))

vi.mock("@supabase/supabase-js", () => ({
	createClient: vi.fn(() => ({
		from: vi.fn().mockImplementation((table: string) => ({
			select: vi.fn().mockReturnValue({ in: vi.fn().mockReturnValue({ data: [], error: null }), order: vi.fn().mockReturnValue({ data: [], error: null }), eq: vi.fn().mockReturnValue({ data: [], error: null }), maybeSingle: vi.fn(async () => ({ data: null })) }),
			in: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ data: [], error: null }) }),
		})),
	})),
}))

describe("server comments", () => {
	beforeEach(() => vi.clearAllMocks())

	it("addComment returns id when authorized and valid", async () => {
		const { addComment } = await import("@/lib/server/projects")
		const res = await addComment("p1", "hello")
		expect("id" in (res as any)).toBe(true)
	})

	it("addComment rejects unauthorized", async () => {
		const { getServerSupabase } = await import("@/lib/supabaseServer")
		;(getServerSupabase as any).mockResolvedValueOnce({ auth: { getUser: async () => ({ data: { user: null } }) } })
		const { addComment } = await import("@/lib/server/projects")
		const res = await addComment("p1", "hello")
		expect(res).toEqual({ error: "unauthorized" })
	})

	it("deleteComment returns ok for author", async () => {
		const { deleteComment } = await import("@/lib/server/projects")
		const res = await deleteComment("c1")
		expect(res).toEqual({ ok: true })
	})

	it("addReply validates parent and returns id", async () => {
		const { addReply } = await import("@/lib/server/projects")
		const res = await addReply("p1", "c0", "hi")
		expect("id" in (res as any)).toBe(true)
	})

	it("toggleProjectUpvote toggles upvote state", async () => {
		const { toggleProjectUpvote } = await import("@/lib/server/projects")
		const up = await toggleProjectUpvote("p1")
		expect((up as any).ok).toBe(true)
	})

	it("toggleCommentUpvote toggles upvote state", async () => {
		const { toggleCommentUpvote } = await import("@/lib/server/projects")
		const up = await toggleCommentUpvote("c1")
		expect((up as any).ok).toBe(true)
	})
})


