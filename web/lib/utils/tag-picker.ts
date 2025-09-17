import type { Tag } from "@/lib/types"

export function normalizeQuery(q: string): string {
  return (q || "").trim().toLowerCase()
}

export function filterTags(tags: Tag[], query: string): Tag[] {
  const q = normalizeQuery(query)
  if (!q) return tags
  return tags.filter((t) => t.name.toLowerCase().includes(q))
}

export function selectSuggested(tags: Tag[], count = 12): Tag[] {
  // Heuristic: take first N since upstream lists are alphabetically sorted
  return (tags || []).slice(0, Math.max(0, count))
}


