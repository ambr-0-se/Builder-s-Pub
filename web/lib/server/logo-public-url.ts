import { getServiceSupabase } from "@/lib/supabaseService"

const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ""

export function toPublicUrl(path: string | undefined | null): string | undefined {
  const p = (path || "").trim()
  if (!p) return undefined
  // If already absolute, return as-is
  if (/^https?:\/\//i.test(p)) return p
  if (!base) return undefined
  return `${base}/storage/v1/object/public/${p.replace(/^\/+/, "")}`
}

export async function deleteStorageObject(bucket: string, path: string): Promise<{ ok: true } | { error: string }> {
  if (!path) return { ok: true } // Nothing to delete
  const service = getServiceSupabase()
  const { error } = await service.storage.from(bucket).remove([path.replace(`${bucket}/`, "")])
  if (error) {
    console.error(`Failed to delete storage object ${bucket}/${path}:`, error)
    return { error: error.message }
  }
  return { ok: true }
}


