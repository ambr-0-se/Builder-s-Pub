import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    const s = statSync(p)
    if (s.isDirectory()) walk(p, acc)
    else if (/\.(tsx|jsx)$/.test(p)) acc.push(p)
  }
  return acc
}

function findViolations(content: string): string[] {
  const violations: string[] = []
  const patterns = [
    /<(a|Link)([^>]*?)target="_blank"([^>]*?)>/gis,
  ]
  for (const re of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(content))) {
      const opening = m[0]
      if (!/\brel=/.test(opening)) {
        violations.push(opening)
      }
    }
  }
  return violations
}

describe("noopener audit", () => {
  it("ensures target=_blank has rel attribute", () => {
    const root = join(process.cwd(), "app")
    const comp = join(process.cwd(), "components")
    const files = [...walk(root), ...walk(comp)]
    const offenders: { file: string; match: string }[] = []
    for (const f of files) {
      const txt = readFileSync(f, "utf8")
      for (const v of findViolations(txt)) offenders.push({ file: f.replace(process.cwd()+"/", ""), match: v })
    }
    if (offenders.length > 0) {
      const details = offenders.map((o) => `- ${o.file}: ${o.match.substring(0, 120)}...`).join("\n")
      throw new Error(`Found ${offenders.length} link(s) with target=_blank missing rel=*.\n${details}`)
    }
    expect(offenders.length).toBe(0)
  })
})


