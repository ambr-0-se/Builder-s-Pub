import { NextResponse } from "next/server"
import { listCollabs } from "@/lib/server/collabs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get("limit") || "20")
  const q = searchParams.get("q") || undefined
  const cursor = searchParams.get("cursor") || undefined
  const stagesParam = searchParams.getAll("stages").flatMap((v) => v.split(",").filter(Boolean))
  const projectTypesParam = searchParams.getAll("projectTypes").flatMap((v) => v.split(",").filter(Boolean))
  const projectTypes = projectTypesParam.length ? projectTypesParam : undefined
  const tech = (searchParams.getAll("techTagIds") || []).flatMap((v) => v.split(",").filter(Boolean)).map((v) => Number(v))
  const cat = (searchParams.getAll("categoryTagIds") || []).flatMap((v) => v.split(",").filter(Boolean)).map((v) => Number(v))

  try {
    const { items, nextCursor } = await listCollabs({
      limit: Number.isFinite(limit) ? limit : 20,
      q,
      cursor,
      stages: stagesParam.length ? stagesParam : undefined,
      projectTypes,
      techTagIds: tech.length ? tech : undefined,
      categoryTagIds: cat.length ? cat : undefined,
    })
    return NextResponse.json({ items, nextCursor })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to list collaborations" }, { status: 500 })
  }
}


