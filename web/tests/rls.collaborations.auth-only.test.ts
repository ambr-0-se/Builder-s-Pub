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
      // Find the specific policy line first, then capture the USING clause until semicolon
      const policyIndex = sql.search(new RegExp(String.raw`create policy\s+${policyName.source}\s+on\s+${table}\s+for\s+select\s+using\s*\(`, "i"))
      expect(policyIndex >= 0, `missing select policy for ${table}`).toBe(true)
      const tail = sql.slice(policyIndex)
      const endIdx = tail.indexOf(";")
      const snippet = endIdx >= 0 ? tail.slice(0, endIdx) : tail
      expect(/auth\.uid\(\)\s+is\s+not\s+null/i.test(snippet), `auth guard missing for ${table}`).toBe(true)
      if (table === "collaborations" || table === "collab_comments") {
        expect(/soft_deleted\s*=\s*false/i.test(snippet), `soft_deleted=false missing for ${table}`).toBe(true)
      }
    }
  })
})


