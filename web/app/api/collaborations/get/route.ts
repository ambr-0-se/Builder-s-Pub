import { NextResponse } from "next/server"
import { getCollab } from "@/lib/server/collabs"
import { getServerSupabase } from "@/lib/supabaseServer"

export async function GET(req: Request) {
  // Stage 17: Auth-only. Require an authenticated session.
  const supabase = await getServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 })
  const item = await getCollab(id)
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ item })
}


