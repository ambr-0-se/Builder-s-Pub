import { supabase } from "@/lib/supabaseClient"
import type { Tag } from "@/lib/types"

export async function fetchTagsByType(type: "technology" | "category"): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id,name,type")
    .eq("type", type)
    .order("name", { ascending: true })

  if (error) {
    throw error
  }

  // Supabase returns unknown date types; cast to our Tag shape
  return (data || []) as Tag[]
}

export async function fetchAllTags(): Promise<{ technology: Tag[]; category: Tag[] }> {
  const { data, error } = await supabase
    .from("tags")
    .select("id,name,type")
    .in("type", ["technology", "category"])
    .order("type", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    throw error
  }

  const items = (data || []) as Tag[]
  return {
    technology: items.filter((t) => t.type === "technology"),
    category: items.filter((t) => t.type === "category"),
  }
}


