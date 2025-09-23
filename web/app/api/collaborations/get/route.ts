import { NextResponse } from "next/server"
import { getCollab } from "@/lib/server/collabs"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 })
  const item = await getCollab(id)
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ item })
}


