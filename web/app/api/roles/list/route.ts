import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET() {
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


