import { NextResponse } from "next/server"
import { listProjects, getUserProjectUpvotesMap } from "@/lib/server/projects"
import { getServerSupabase } from "@/lib/supabaseServer"

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const sort = (searchParams.get("sort") as "recent" | "popular") || "recent"
	const limit = Number(searchParams.get("limit") || "20")
	const q = searchParams.get("q") || undefined
	const tech = (searchParams.getAll("techTagIds") || []).flatMap((v) => v.split(",").filter(Boolean)).map((v) => Number(v))
	const cat = (searchParams.getAll("categoryTagIds") || [])
		.flatMap((v) => v.split(",").filter(Boolean))
		.map((v) => Number(v))
    const cursor = searchParams.get("cursor") || undefined

	try {
		const { items, nextCursor } = await listProjects({
			sort,
			limit: Number.isFinite(limit) ? limit : 20,
			q,
			cursor,
			techTagIds: tech.length ? tech : undefined,
			categoryTagIds: cat.length ? cat : undefined,
		})

		// Attach hasUserUpvoted when a session exists
		try {
			const supabase = await getServerSupabase()
			const { data: auth } = await supabase.auth.getUser()
			if (auth.user) {
				const ids = (items || []).map((p: any) => p.project.id as string)
				const map = await getUserProjectUpvotesMap(ids)
				for (const p of items) {
					p.hasUserUpvoted = map.get(p.project.id) || false
				}
			}
		} catch (_err) {
			// best-effort; ignore personalization errors
		}

		return NextResponse.json({ items, nextCursor })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || "Failed to list projects" }, { status: 500 })
	}
}


