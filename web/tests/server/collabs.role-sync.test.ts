import { describe, it, expect, vi, beforeEach } from "vitest"

const hoisted = vi.hoisted(() => ({ insertCalls: [] as any[] }))

describe("collaborations role sync (join table)", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    hoisted.insertCalls.length = 0
  })

  it("dedupes/trims roles and inserts to collaboration_roles after create", async () => {
    vi.mock("@/lib/supabaseServer", () => ({
      getServerSupabase: vi.fn(async () => ({
        auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "collaborations") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn(async () => ({ data: { id: "c-sync" }, error: null })),
                }),
              }),
              delete: vi.fn().mockReturnValue({ eq: vi.fn(async () => ({}) ) }),
              update: vi.fn().mockReturnValue({ eq: vi.fn(async () => ({}) ) }),
            }
          }
          if (table === "collaboration_tags") {
            return { insert: vi.fn(async () => ({ error: null })) }
          }
          if (table === "collaboration_roles") {
            return {
              insert: vi.fn(async (rows: any[]) => {
                hoisted.insertCalls.push(rows)
                return { error: null }
              }),
              delete: vi.fn().mockReturnValue({ eq: vi.fn(async () => ({}) ) }),
            }
          }
          return { select: vi.fn().mockReturnValue({ single: vi.fn(async () => ({ data: null, error: null })) }) }
        }),
      })),
    }))

    const { createCollab } = await import("@/lib/server/collabs")
    const res = await createCollab({
      title: "T",
      affiliatedOrg: "",
      projectTypes: ["personal"],
      description: "D",
      stage: "ideation",
      lookingFor: [
        { role: "AI Engineer" },
        { role: "  Designer  " },
      ],
      contact: "me@example.com",
      remarks: "",
      techTagIds: [1],
      categoryTagIds: [2],
    } as any)

    expect("id" in (res as any)).toBe(true)
    expect(hoisted.insertCalls.length).toBeGreaterThan(0)
    const last = hoisted.insertCalls[hoisted.insertCalls.length - 1]
    const roles = last.map((r: any) => r.role)
    expect(roles).toEqual(["AI Engineer", "Designer"]) // trimmed
  })
})


