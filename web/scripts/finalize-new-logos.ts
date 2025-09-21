#!/usr/bin/env -S node --enable-source-maps

/**
 * Backfill: finalize temp logo paths stored under `new/<userId>/...` to canonical `<entityId>/...`.
 *
 * - projects: project-logos/new/<userId>/<file> -> project-logos/<projectId>/<file>
 * - collabs:  collab-logos/new/<userId>/<file>  -> collab-logos/<collabId>/<file>
 *
 * Usage examples:
 *  pnpm dlx tsx scripts/finalize-new-logos.ts --dry-run=true
 *  pnpm dlx tsx scripts/finalize-new-logos.ts --only=projects
 *  pnpm dlx tsx scripts/finalize-new-logos.ts --only=collabs
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type Flags = {
  dryRun: boolean
  only: "all" | "projects" | "collabs"
  batchSize: number
}

function parseFlags(argv: string[]): Flags {
  const defaults: Flags = { dryRun: true, only: "all", batchSize: 200 }
  const out = { ...defaults }
  for (const arg of argv) {
    if (arg === "--dry-run=false") out.dryRun = false
    else if (arg === "--dry-run=true") out.dryRun = true
    else if (arg.startsWith("--only=")) {
      const v = arg.slice(7)
      if (v === "projects" || v === "collabs" || v === "all") out.only = v
    }
    else if (arg.startsWith("--batch=")) out.batchSize = Math.max(1, Number(arg.slice(8)) || defaults.batchSize)
  }
  return out
}

function envOrThrow(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env: ${name}`)
  return v
}

async function moveWithFallback(service: SupabaseClient<any, any, any>, bucket: string, fromFull: string, toFull: string): Promise<{ ok: true } | { error: string }> {
  const fromPath = fromFull.replace(`${bucket}/`, "")
  const toPath = toFull.replace(`${bucket}/`, "")
  const { error: moveError } = await service.storage.from(bucket).move(fromPath, toPath)
  if (!moveError) return { ok: true }
  const { error: copyError } = await service.storage.from(bucket).copy(fromPath, toPath)
  if (copyError) return { error: copyError.message }
  const { error: remError } = await service.storage.from(bucket).remove([fromPath])
  if (remError) return { error: remError.message }
  return { ok: true }
}

async function finalizeProjects(service: SupabaseClient<any, any, any>, dryRun: boolean, batchSize: number) {
  let offset = 0
  let updated = 0
  let moved = 0
  let errors = 0
  for (;;) {
    const { data: rows, error } = await service
      .from("projects")
      .select("id, logo_path")
      .like("logo_path", "project-logos/new/%")
      .range(offset, offset + batchSize - 1)
    if (error) throw error
    const list = rows || []
    if (list.length === 0) break
    for (const r of list as any[]) {
      const id = r.id as string
      const src: string = r.logo_path as string
      const filename = String(src).split("/").pop() || `${id}.png`
      const dest = `project-logos/${id}/${filename}`
      if (dryRun) {
        console.log(`[finalize][projects] would move ${src} -> ${dest}`)
      } else {
        const res = await moveWithFallback(service, "project-logos", src, dest)
        if ((res as any).ok) {
          moved++
          const { error: updErr } = await service.from("projects").update({ logo_path: dest }).eq("id", id)
          if (updErr) { errors++; console.error(`[finalize][projects] update failed for ${id}:`, updErr.message) } else updated++
        } else {
          errors++
          console.error(`[finalize][projects] move failed for ${id}:`, (res as any).error)
        }
      }
    }
    offset += list.length
  }
  console.log(`[finalize][projects] moved=${moved} updated=${updated} errors=${errors}`)
}

async function finalizeCollabs(service: SupabaseClient<any, any, any>, dryRun: boolean, batchSize: number) {
  let offset = 0
  let updated = 0
  let moved = 0
  let errors = 0
  for (;;) {
    const { data: rows, error } = await service
      .from("collaborations")
      .select("id, logo_path")
      .like("logo_path", "collab-logos/new/%")
      .range(offset, offset + batchSize - 1)
    if (error) throw error
    const list = rows || []
    if (list.length === 0) break
    for (const r of list as any[]) {
      const id = r.id as string
      const src: string = r.logo_path as string
      const filename = String(src).split("/").pop() || `${id}.png`
      const dest = `collab-logos/${id}/${filename}`
      if (dryRun) {
        console.log(`[finalize][collabs] would move ${src} -> ${dest}`)
      } else {
        const res = await moveWithFallback(service, "collab-logos", src, dest)
        if ((res as any).ok) {
          moved++
          const { error: updErr } = await service.from("collaborations").update({ logo_path: dest }).eq("id", id)
          if (updErr) { errors++; console.error(`[finalize][collabs] update failed for ${id}:`, updErr.message) } else updated++
        } else {
          errors++
          console.error(`[finalize][collabs] move failed for ${id}:`, (res as any).error)
        }
      }
    }
    offset += list.length
  }
  console.log(`[finalize][collabs] moved=${moved} updated=${updated} errors=${errors}`)
}

async function main() {
  const flags = parseFlags(process.argv.slice(2))
  const supabaseUrl = envOrThrow("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = envOrThrow("SUPABASE_SERVICE_ROLE_KEY")
  const service = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })

  console.log(`[finalize] dryRun=${flags.dryRun} only=${flags.only}`)
  if (flags.only === "all" || flags.only === "projects") {
    await finalizeProjects(service, flags.dryRun, flags.batchSize)
  }
  if (flags.only === "all" || flags.only === "collabs") {
    await finalizeCollabs(service, flags.dryRun, flags.batchSize)
  }
}

main().catch((e) => {
  console.error("[finalize] fatal", e)
  process.exitCode = 1
})


