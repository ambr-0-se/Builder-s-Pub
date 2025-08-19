"use server"

import { getServerSupabase } from "@/lib/supabaseServer"
import { profileSchema } from "./schema"

// schema is imported to keep this file exporting only async functions

export async function getMyProfile() {
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { profile: null, isAuthenticated: false }

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, bio, github_url, linkedin_url, website_url")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return { profile: null, isAuthenticated: true, error: error.message }
  }

  if (!data) {
    return {
      profile: {
        userId: user.id,
        displayName: user.email || "User",
      },
      isAuthenticated: true,
    }
  }

  return {
    profile: {
      userId: data.user_id,
      displayName: data.display_name,
      bio: data.bio || undefined,
      githubUrl: data.github_url || undefined,
      linkedinUrl: data.linkedin_url || undefined,
      websiteUrl: data.website_url || undefined,
    },
    isAuthenticated: true,
  }
}

export async function updateMyProfile(formData: FormData) {
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "unauthorized" }

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName") || "",
    bio: formData.get("bio") || "",
    githubUrl: formData.get("githubUrl") || "",
    linkedinUrl: formData.get("linkedinUrl") || "",
    websiteUrl: formData.get("websiteUrl") || "",
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { ok: false, error: "validation_error", fieldErrors }
  }

  const { displayName, bio, githubUrl, linkedinUrl, websiteUrl } = parsed.data

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        display_name: displayName,
        bio: bio || null,
        github_url: githubUrl || null,
        linkedin_url: linkedinUrl || null,
        website_url: websiteUrl || null,
      },
      { onConflict: "user_id" }
    )

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}


