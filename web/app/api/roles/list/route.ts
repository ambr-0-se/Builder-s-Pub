import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabaseServer"

export async function GET() {
  const supabase = await getServerSupabase()
  const { data, error } = await supabase
    .from("roles_catalog")
    .select("name")
    .order("name", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const roles = (data || []).map((r: any) => r.name)
  return NextResponse.json({ roles })
}


