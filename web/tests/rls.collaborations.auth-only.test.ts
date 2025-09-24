import { describe, it, expect } from "vitest"
import { readFile } from "node:fs/promises"
import path from "node:path"

describe("RLS policies enforce auth-only selects for collaboration tables", () => {
  it("contains auth.uid() is not null for select on collaborations and related tables", async () => {
    const rlsPath = path.resolve(process.cwd(), "..", "supabase", "rls_policies.sql")
    const sql = await readFile(rlsPath, "utf8")

    const checks: Array<{ table: string; policyName: RegExp }> = [
      { table: "collaborations", policyName: /collab_select_all/ },
      { table: "collaboration_tags", policyName: /collaboration_tags_select_all/ },
      { table: "collaboration_upvotes", policyName: /collab_upvotes_select_all/ },
      { table: "collab_comments", policyName: /collab_comments_select_all/ },
      { table: "collaboration_roles", policyName: /collaboration_roles_select_all/ },
    ]

    for (const { table, policyName } of checks) {
      const tableBlock = new RegExp(
        String.raw`(?s)alter table.*?${table}.*?create policy\s+${policyName.source}.*?for select using \((.*?)\);`,
        "i"
      )
      const match = sql.match(tableBlock)
      expect(match, `missing select policy for ${table}`).toBeTruthy()
      const usingClause = match?.[1] || ""
      expect(/auth\.uid\(\)\s+is\s+not\s+null/i.test(usingClause), `auth guard missing for ${table}`).toBe(true)
      // For collaborations and collab_comments, also assert soft_deleted=false is preserved
      if (table === "collaborations" || table === "collab_comments") {
        expect(/soft_deleted\s*=\s*false/i.test(usingClause), `soft_deleted=false missing for ${table}`).toBe(true)
      }
    }
  })
})


