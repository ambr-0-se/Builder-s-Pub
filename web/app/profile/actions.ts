"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSupabase } from "@/lib/supabaseServer"
import { profileSchema } from "./schema"
import { trackServer } from "@/lib/analytics"

// schema is imported to keep this file exporting only async functions

export async function getMyProfile() {
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { profile: null, isAuthenticated: false }

  let { data, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, bio, github_url, linkedin_url, website_url, x_url, region, timezone, skills, building_now, looking_for, contact")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    // Fallback for older schemas without the new columns
    const fallback = await supabase
      .from("profiles")
      .select("user_id, display_name, bio, github_url, linkedin_url, website_url")
      .eq("user_id", user.id)
      .maybeSingle()
    data = fallback.data as any
    error = fallback.error as any
  }

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
      xUrl: data.x_url || undefined,
      region: data.region || undefined,
      timezone: data.timezone || undefined,
      skills: data.skills || undefined,
      buildingNow: data.building_now || undefined,
      lookingFor: data.looking_for || undefined,
      contact: data.contact || undefined,
    },
    isAuthenticated: true,
  }
}

export type UpdateProfileState = { fieldErrors?: Record<string, string>; formError?: string } | null

export async function updateMyProfile(formData: FormData): Promise<UpdateProfileState> {
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { formError: "unauthorized" }

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName") || "",
    bio: formData.get("bio") || "",
    githubUrl: formData.get("githubUrl") || "",
    linkedinUrl: formData.get("linkedinUrl") || "",
    websiteUrl: formData.get("websiteUrl") || "",
    xUrl: formData.get("xUrl") || "",
    region: formData.get("region") || "",
    timezone: formData.get("timezone") || "",
    skills: formData.get("skills") || "",
    buildingNow: formData.get("buildingNow") || "",
    lookingFor: formData.get("lookingFor") || "",
    contact: formData.get("contact") || "",
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { fieldErrors }
  }

  const { displayName, bio, githubUrl, linkedinUrl, websiteUrl, xUrl, region, timezone, skills, buildingNow, lookingFor, contact } = parsed.data

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
        x_url: xUrl || null,
        region: region || null,
        timezone: timezone || null,
        skills: skills ? (typeof skills === "string" ? skills.split(",").map((s) => s.trim()).filter(Boolean) : skills) : null,
        building_now: buildingNow || null,
        looking_for: lookingFor || null,
        contact: contact || null,
      },
      { onConflict: "user_id" }
    )

  if (error) {
    return { formError: error.message }
  }

  revalidatePath("/profile")

  // Analytics: profile updated
  try {
    trackServer("profile_update", { userId: user.id })
  } catch {}

  redirect("/profile")
}


