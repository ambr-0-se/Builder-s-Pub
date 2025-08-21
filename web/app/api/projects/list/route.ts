import { NextResponse } from "next/server"
import { listProjects } from "@/lib/server/projects"

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const sort = (searchParams.get("sort") as "recent" | "popular") || "recent"
	const limit = Number(searchParams.get("limit") || "20")
	const tech = (searchParams.getAll("techTagIds") || []).flatMap((v) => v.split(",").filter(Boolean)).map((v) => Number(v))
	const cat = (searchParams.getAll("categoryTagIds") || [])
		.flatMap((v) => v.split(",").filter(Boolean))
		.map((v) => Number(v))

	try {
		const { items, nextCursor } = await listProjects({
			sort,
			limit: Number.isFinite(limit) ? limit : 20,
			techTagIds: tech.length ? tech : undefined,
			categoryTagIds: cat.length ? cat : undefined,
		})
		return NextResponse.json({ items, nextCursor })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || "Failed to list projects" }, { status: 500 })
	}
}


