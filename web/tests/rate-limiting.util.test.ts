import { describe, it, expect, beforeEach } from "vitest"
import { checkRateLimit } from "@/lib/server/rate-limiting"

// Simple in-memory store keyed by action:user:window_start
const windowKey = (action: string, user: string, start: string) => `${action}:${user}:${start}`
const store: Record<string, number> = {}

// Minimal supabase stub implementing the methods used by checkRateLimit
function createSupabaseStub() {
  const where: Record<string, string> = {}
  const from = (table: string) => {
    if (table === "rate_limits") {
      return {
        select: () => ({
          eq: (col: string, val: string) => {
            where[col] = val
            return {
              eq: (col2: string, val2: string) => {
                where[col2] = val2
                return {
                  eq: (col3: string, val3: string) => {
                    where[col3] = val3
                    return {
                      maybeSingle: async () => {
                        const key = windowKey(where["action"], where["user_id"], where["window_start"]) || ""
                        const count = store[key]
                        return count !== undefined ? { data: { count } as any, error: null } : { data: null as any, error: null }
                      },
                    }
                  },
                }
              },
            }
          },
        }),
        upsert: async (row: any) => {
          const key = windowKey(row.action, row.user_id, row.window_start)
          store[key] = row.count
          return { error: null }
        },
      }
    }
    return { select: () => ({}) }
  }
  return { from } as any
}

describe("checkRateLimit utility", () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k]
  })

  it("allows up to the limit within the window, then blocks", async () => {
    const supabase = createSupabaseStub()
    const params = { action: "test_action", userId: "u1", limit: 3, windowSec: 60 }

    // First three should pass
    for (let i = 0; i < 3; i++) {
      const res = await checkRateLimit(supabase, params)
      expect(res.limited).toBe(false)
    }

    // Fourth should be limited
    const blocked = await checkRateLimit(supabase, params)
    expect(blocked.limited).toBe(true)
    expect(typeof blocked.retryAfterSec).toBe("number")
  })
})


