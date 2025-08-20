"use server"

import type { Tag } from "@/lib/types"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function getAllTagsServer(): Promise<{ technology: Tag[]; category: Tag[] }> {
  // Use anonymous client for public data (tags are public read via RLS)
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
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


