"use server"

import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/server/admin"
import { getServiceSupabase } from "@/lib/supabaseService"
import { validateTagInput } from "@/lib/validation/tags"

export type CreateTagState = { fieldErrors?: Record<string, string>; formError?: string; success?: boolean } | null

export async function createTag(_prev: CreateTagState, formData: FormData): Promise<CreateTagState> {
  const ok = await isAdmin()
  if (!ok) return { formError: "unauthorized" }

  const name = String(formData.get("name") || "")
  const type = String(formData.get("type") || "") as "technology" | "category"
  const { fieldErrors } = validateTagInput(name, type)
  if (fieldErrors) return { fieldErrors }

  try {
    const supabase = getServiceSupabase()
    const { error } = await supabase.from("tags").insert({ name: name.trim(), type })
    if (error) {
      if ((error as any).code === "23505" || (error.message || "").toLowerCase().includes("duplicate")) {
        return { formError: "Tag already exists (name + type must be unique)." }
      }
      return { formError: error.message || "Failed to create tag" }
    }

    revalidatePath("/")
    revalidatePath("/projects")
    revalidatePath("/search")
    return { success: true }
  } catch (e: any) {
    return { formError: e?.message || "Failed to create tag" }
  }
}
