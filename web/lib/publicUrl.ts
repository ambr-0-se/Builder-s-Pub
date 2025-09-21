export function toPublicUrl(path: string | undefined | null): string | undefined {
  const p = (path || "").trim()
  if (!p) return undefined
  if (/^https?:\/\//i.test(p)) return p
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  if (!base) return undefined
  return `${base}/storage/v1/object/public/${p.replace(/^\/+/, "")}`
}


