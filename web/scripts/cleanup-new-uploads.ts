#!/usr/bin/env -S node --enable-source-maps

/**
 * Scheduled cleanup for stale temporary uploads under `new/<userId>/...`.
 *
 * Buckets scanned:
 *  - project-logos
 *  - collab-logos
 *  - profile-avatars
 *
 * Strategy:
 *  - For each bucket, list the `new/` folder to get user folders, then list files in each user folder
 *  - If (now - (updated_at || created_at)) > TTL → delete
 *  - Batch deletions to respect API limits
 *
 * Usage:
 *  pnpm dlx tsx scripts/cleanup-new-uploads.ts --ttl=24 --dry-run=false
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type Flags = {
  ttlHours: number
  dryRun: boolean
  buckets: string[]
  batchSize: number
  minAgeMinutes: number
}

function parseFlags(argv: string[]): Flags {
  const defaults: Flags = {
    ttlHours: 24,
    dryRun: true,
    buckets: ["project-logos", "collab-logos", "profile-avatars"],
    batchSize: 100,
    minAgeMinutes: 10,
  }

  const out = { ...defaults }
  for (const arg of argv) {
    if (arg.startsWith("--ttl=")) out.ttlHours = Math.max(1, Number(arg.slice(6)) || defaults.ttlHours)
    else if (arg === "--dry-run=false") out.dryRun = false
    else if (arg === "--dry-run=true") out.dryRun = true
    else if (arg.startsWith("--buckets=")) out.buckets = arg.slice(10).split(",").map(s => s.trim()).filter(Boolean)
    else if (arg.startsWith("--batch=")) out.batchSize = Math.max(1, Number(arg.slice(8)) || defaults.batchSize)
    else if (arg.startsWith("--min-age-min=")) out.minAgeMinutes = Math.max(0, Number(arg.slice(14)) || defaults.minAgeMinutes)
  }
  return out
}

function envOrThrow(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env: ${name}`)
  return v
}

type FileObject = {
  name: string
  id?: string
  created_at?: string
  updated_at?: string
  last_accessed_at?: string
  metadata?: Record<string, unknown>
}

async function listAll(service: SupabaseClient<any, any, any>, bucket: string, path: string): Promise<FileObject[]> {
  const limit = 100
  let offset = 0
  const out: FileObject[] = []
  for (;;) {
    const { data, error } = await service.storage.from(bucket).list(path, { limit, offset, sortBy: { column: "updated_at", order: "asc" } as any })
    if (error) throw error
    const items = data || []
    out.push(...items)
    if (items.length < limit) break
    offset += limit
  }
  return out
}

function hoursBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60)
}

function toAgeHours(now: Date, f: FileObject): number | null {
  // Prefer created_at to avoid keeping files alive if updated_at is bumped by internal ops
  const t = f.created_at || f.updated_at || f.last_accessed_at
  if (!t) return null
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return null
  return hoursBetween(now, d)
}

async function deleteInBatches(service: SupabaseClient<any, any, any>, bucket: string, keys: string[], batchSize: number): Promise<{ deleted: number; errors: number }> {
  let deleted = 0
  let errors = 0
  for (let i = 0; i < keys.length; i += batchSize) {
    const slice = keys.slice(i, i + batchSize)
    const { error } = await service.storage.from(bucket).remove(slice)
    if (error) {
      console.error(`[cleanup] remove error in bucket=${bucket}`, error)
      errors += slice.length
    } else {
      deleted += slice.length
    }
  }
  return { deleted, errors }
}

async function main() {
  const flags = parseFlags(process.argv.slice(2))
  const supabaseUrl = envOrThrow("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = envOrThrow("SUPABASE_SERVICE_ROLE_KEY")
  const service = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const now = new Date()
  const ttl = flags.ttlHours
  const minAgeMin = flags.minAgeMinutes
  let totalCandidates = 0
  let totalDeleted = 0
  let totalErrors = 0

  for (const bucket of flags.buckets) {
    // List user directories under `new/`
    const userDirs = await listAll(service, bucket, "new")
    const userNames = userDirs.map(d => d.name)
    console.log(`[cleanup] bucket=${bucket} userDirs=${userNames.length}`)

    const deleteKeys: string[] = []

    for (const user of userNames) {
      // List files within each user's temp folder
      const files = await listAll(service, bucket, `new/${user}`)
      for (const f of files) {
        // Skip any nested folders defensively
        if (!f.name || f.name.endsWith("/")) continue
        const age = toAgeHours(now, f)
        if (age === null) continue
        // Guard against very recent files even if ttl is configured aggressively (manual runs)
        if (age > ttl && age * 60 > minAgeMin) {
          totalCandidates += 1
          deleteKeys.push(`new/${user}/${f.name}`)
        }
      }
    }

    if (flags.dryRun) {
      console.log(`[cleanup] DRY-RUN bucket=${bucket} candidates=${deleteKeys.length}`)
      for (const key of deleteKeys) console.log(`  - ${key}`)
    } else {
      const res = await deleteInBatches(service, bucket, deleteKeys, flags.batchSize)
      totalDeleted += res.deleted
      totalErrors += res.errors
      console.log(`[cleanup] bucket=${bucket} deleted=${res.deleted} errors=${res.errors}`)
    }
  }

  console.log(`[cleanup] summary candidates=${totalCandidates} deleted=${totalDeleted} errors=${totalErrors} dryRun=${flags.dryRun}`)
}

main().catch(err => {
  console.error("[cleanup] fatal", err)
  process.exitCode = 1
})


