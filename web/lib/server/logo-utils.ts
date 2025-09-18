export const ALLOWED_IMAGE_EXTS = ["png", "jpg", "jpeg", "svg"] as const
export type AllowedImageExt = typeof ALLOWED_IMAGE_EXTS[number]

export function normalizeExt(input: string): AllowedImageExt | null {
  const e = String(input || "").trim().toLowerCase().replace(/^\./, "")
  if ((ALLOWED_IMAGE_EXTS as readonly string[]).includes(e)) return e as AllowedImageExt
  return null
}

export function buildObjectPath(bucket: "project-logos" | "collab-logos" | "profile-avatars", id: string, filename: string): string {
  const safeId = String(id || "").trim()
  const safeName = String(filename || "").trim().replace(/\s+/g, "-")
  return `${bucket}/${safeId}/${safeName}`
}

export function pathBelongsToId(bucket: string, id: string, path: string): boolean {
  const prefix = `${bucket}/${id}/`
  return typeof path === "string" && path.startsWith(prefix)
}
