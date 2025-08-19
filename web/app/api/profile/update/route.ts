import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabaseServer"
import { profileSchema } from "@/app/profile/schema"

export async function POST(req: Request) {
  const supabase = await getServerSupabase()
  const body = await req.json().catch(() => ({}))

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return NextResponse.json({ error: "validation_error", fieldErrors }, { status: 400 })
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}


