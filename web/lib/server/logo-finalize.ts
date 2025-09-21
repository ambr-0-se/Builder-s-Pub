import { getServiceSupabase } from "@/lib/supabaseService"

export function isTempPathForUser(path: string, userId: string, bucket: "project-logos" | "collab-logos" | "profile-avatars"): boolean {
  const p = (path || "").trim()
  if (!p) return false
  return p.startsWith(`${bucket}/new/${userId}/`)
}

export function destForProject(projectId: string, filename: string): string {
  return `project-logos/${projectId}/${filename}`
}

export function destForCollab(collabId: string, filename: string): string {
  return `collab-logos/${collabId}/${filename}`
}

export async function moveObject(bucket: string, fromFull: string, toFull: string): Promise<{ ok: true } | { error: string }> {
  const service = getServiceSupabase()
  const from = fromFull.replace(`${bucket}/`, "")
  const to = toFull.replace(`${bucket}/`, "")
  // Try native move
  const anyStorage = service.storage as any
  if (typeof anyStorage.from(bucket).move === "function") {
    const { error } = await anyStorage.from(bucket).move(from, to)
    if (!error) return { ok: true }
  }
  // Fallback: copy then remove
  try {
    const { error: copyErr } = await anyStorage.from(bucket).copy(from, to)
    if (copyErr) return { error: copyErr.message }
    const { error: delErr } = await service.storage.from(bucket).remove([from])
    if (delErr) {
      // not fatal, but report
      console.warn(`moveObject fallback: failed to delete ${bucket}/${from}:`, delErr)
    }
    return { ok: true }
  } catch (e: any) {
    return { error: e?.message || "move_failed" }
  }
}


