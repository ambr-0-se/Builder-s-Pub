"use server"

import { getServerSupabase } from "@/lib/supabaseServer"
import { deleteStorageObject } from "@/lib/server/logo-public-url"

function isOwnNewPath(userId: string, path: string): { bucket: string } | null {
  const p = (path || "").trim()
  if (!p) return null
  // Allowed patterns: project-logos/new/<uid>/..., collab-logos/new/<uid>/..., profile-avatars/new/<uid>/...
  const patterns = [
    { bucket: "project-logos", prefix: `project-logos/new/${userId}/` },
    { bucket: "collab-logos", prefix: `collab-logos/new/${userId}/` },
    { bucket: "profile-avatars", prefix: `profile-avatars/new/${userId}/` },
  ]
  for (const it of patterns) {
    if (p.startsWith(it.prefix)) return { bucket: it.bucket }
  }
  return null
}

export async function deleteTempLogo(path: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await getServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { error: "unauthorized" }

  const match = isOwnNewPath(auth.user.id, path)
  if (!match) return { error: "invalid_temp_path" }

  const res = await deleteStorageObject(match.bucket, path)
  if ((res as any).error) return { error: (res as any).error }
  return { ok: true }
}

// Note: no non-async exports. Helper kept internal to satisfy Next.js server action constraints.
