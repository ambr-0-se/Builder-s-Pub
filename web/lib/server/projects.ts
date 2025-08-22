"use server"

import { createClient } from "@supabase/supabase-js"
import type { ProjectWithRelations, Tag, Comment, Profile } from "@/lib/types"
import { getServerSupabase } from "@/lib/supabaseServer"
import { createProjectSchema, type CreateProjectInput } from "@/app/projects/schema"
import { commentSchema } from "@/app/projects/schema"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

function getAnonServerClient() {
	return createClient(supabaseUrl, supabaseAnonKey)
}

export async function createProject(input: CreateProjectInput): Promise<{ id: string } | { fieldErrors?: Record<string, string>; formError?: string }> {
	const supabase = await getServerSupabase()
	const { data: auth } = await supabase.auth.getUser()
	if (!auth.user) {
		return { formError: "unauthorized" }
	}

	const parsed = createProjectSchema.safeParse(input)
	if (!parsed.success) {
		const fieldErrors: Record<string, string> = {}
		for (const issue of parsed.error.issues) {
			const key = issue.path[0] as string
			if (!fieldErrors[key]) fieldErrors[key] = issue.message
		}
		return { fieldErrors }
	}

	const { title, tagline, description, demoUrl, sourceUrl, techTagIds, categoryTagIds } = parsed.data

	// Insert project
	const { data: projectRow, error: insertError } = await supabase
		.from("projects")
		.insert({
			owner_id: auth.user.id,
			title,
			tagline,
			description,
			demo_url: demoUrl,
			source_url: sourceUrl || null,
		})
		.select("id")
		.single()

	if (insertError || !projectRow) {
		return { formError: insertError?.message || "Failed to create project" }
	}

	const projectId: string = projectRow.id
	const allTagIds = [...new Set([...(techTagIds || []), ...(categoryTagIds || [])])]
	if (allTagIds.length > 0) {
		const tagRows = allTagIds.map((tagId) => ({ project_id: projectId, tag_id: tagId }))
		const { error: tagsError } = await supabase.from("project_tags").insert(tagRows)
		if (tagsError) {
			// Best-effort rollback to avoid orphaned project without tags
			await supabase.from("projects").delete().eq("id", projectId)
			return { formError: tagsError.message }
		}
	}

	return { id: projectId }
}

export interface ListProjectsParams {
	cursor?: string
	limit?: number
	sort?: "recent" | "popular"
	techTagIds?: number[]
	categoryTagIds?: number[]
}

export async function listProjects(params: ListProjectsParams = {}): Promise<{ items: ProjectWithRelations[]; nextCursor?: string }> {
	const anon = getAnonServerClient()
	const limit = params.limit && params.limit > 0 ? params.limit : 20

	// Determine candidate project ids matching filters first (safe approach)
	let candidateIds: string[] | null = null

	if (params.techTagIds && params.techTagIds.length > 0) {
		const { data, error } = await anon
			.from("project_tags")
			.select("project_id")
			.in("tag_id", params.techTagIds)
		if (error) throw error
		candidateIds = (data || []).map((r: any) => r.project_id as string)
	}

	if (params.categoryTagIds && params.categoryTagIds.length > 0) {
		const { data, error } = await anon
			.from("project_tags")
			.select("project_id")
			.in("tag_id", params.categoryTagIds)
		if (error) throw error
		const catIds = (data || []).map((r: any) => r.project_id as string)
		candidateIds = candidateIds ? candidateIds.filter((id) => catIds.includes(id)) : catIds
	}

	// Base projects query
	let query = anon
		.from("projects")
		.select("id, owner_id, title, tagline, description, demo_url, source_url, created_at")
		.eq("soft_deleted", false)

	if (candidateIds) {
		if (candidateIds.length === 0) return { items: [] }
		query = query.in("id", candidateIds)
	}

	// Sorting
	if (params.sort === "popular") {
		// Fetch recent projects first, then compute upvote counts for those ids
		const { data: projects, error: projectsError } = await query.order("created_at", { ascending: false }).limit(limit)
		if (projectsError) throw projectsError
		if (!projects) return { items: [] }

		const projectIds = projects.map((p: any) => p.id as string)
		const countMap = await fetchUpvoteCounts(projectIds, anon)

		const [tagsByProject, ownersByUser] = await Promise.all([
			fetchTagsByProjectIds(projectIds, anon),
			fetchOwnersByUserIds(projects.map((p: any) => p.owner_id as string), anon),
		])

		const items = projects
			.map((p: any) => toProjectWithRelations(p, tagsByProject.get(p.id) || { technology: [], category: [] }, ownersByUser.get(p.owner_id), countMap.get(p.id) || 0))
			.sort((a, b) => {
				if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount
				return b.project.createdAt.getTime() - a.project.createdAt.getTime()
			})
			.slice(0, limit)

		return { items }
	}

	// recent
	const { data: projects, error } = await query.order("created_at", { ascending: false }).limit(limit)
	if (error) throw error
	if (!projects) return { items: [] }

	const projectIds = projects.map((p: any) => p.id as string)
	const [tagsByProject, ownersByUser, voteCounts] = await Promise.all([
		fetchTagsByProjectIds(projectIds, anon),
		fetchOwnersByUserIds(projects.map((p: any) => p.owner_id as string), anon),
		fetchUpvoteCounts(projectIds, anon),
	])

	const items = (projects as any[]).map((p) =>
		toProjectWithRelations(p, tagsByProject.get(p.id) || { technology: [], category: [] }, ownersByUser.get(p.owner_id), voteCounts.get(p.id) || 0)
	)

	return { items }
}

export async function getProject(id: string): Promise<ProjectWithRelations | null> {
	const anon = getAnonServerClient()
	const { data: p, error } = await anon
		.from("projects")
		.select("id, owner_id, title, tagline, description, demo_url, source_url, created_at, soft_deleted")
		.eq("id", id)
		.maybeSingle()

	if (error) throw error
	if (!p || p.soft_deleted) return null

	const [tags, owner, voteCount, comments] = await Promise.all([
		fetchTagsByProjectIds([p.id], anon),
		fetchOwnersByUserIds([p.owner_id], anon),
		fetchUpvoteCounts([p.id], anon),
		fetchCommentsByProjectId(p.id, anon),
	])

	const tagMap = tags.get(p.id) || { technology: [], category: [] }
	const ownerProfile = owner.get(p.owner_id)
	const upvotes = voteCount.get(p.id) || 0

	return toProjectWithRelations(p as any, tagMap, ownerProfile, upvotes, comments)
}

function toProjectWithRelations(
	row: any,
	tags: { technology: Tag[]; category: Tag[] },
 	owner: { userId: string; displayName: string } | undefined,
 	upvoteCount: number,
 	comments: Comment[] = []
): ProjectWithRelations {
	return {
		project: {
			id: row.id,
			ownerId: row.owner_id,
			title: row.title,
			tagline: row.tagline,
			description: row.description,
			demoUrl: row.demo_url,
			sourceUrl: row.source_url || undefined,
			createdAt: new Date(row.created_at),
			softDeleted: undefined,
		},
		tags,
		upvoteCount,
		comments,
		owner: {
			userId: owner?.userId || row.owner_id,
			displayName: owner?.displayName || "User",
		},
		hasUserUpvoted: false,
	}
}

async function fetchTagsByProjectIds(projectIds: string[], anon: ReturnType<typeof getAnonServerClient>) {
	if (projectIds.length === 0) return new Map<string, { technology: Tag[]; category: Tag[] }>()
	// Fetch raw joins in two steps to avoid nested relation errors on some PostgREST versions
	const { data: rows, error } = await anon
		.from("project_tags")
		.select("project_id, tag_id")
		.in("project_id", projectIds)
	if (error) throw error

	const tagIds = Array.from(new Set(((rows || []) as any[]).map((r) => r.tag_id as number)))
	let tagsById = new Map<number, Tag>()
	if (tagIds.length > 0) {
		const { data: tags, error: tagErr } = await anon.from("tags").select("id,name,type").in("id", tagIds)
		if (tagErr) throw tagErr
		for (const t of (tags || []) as any[]) tagsById.set(t.id as number, { id: t.id, name: t.name, type: t.type })
	}
	const map = new Map<string, { technology: Tag[]; category: Tag[] }>()
	for (const row of (rows || []) as any[]) {
		const pid = row.project_id as string
		const tag = tagsById.get(row.tag_id as number)
		if (!tag) continue
		if (!map.has(pid)) map.set(pid, { technology: [], category: [] })
		const bucket = tag.type === "category" ? "category" : "technology"
		map.get(pid)![bucket].push(tag)
	}
	return map
}

async function fetchOwnersByUserIds(userIds: string[], anon: ReturnType<typeof getAnonServerClient>) {
	if (userIds.length === 0) return new Map<string, { userId: string; displayName: string }>()
	const { data, error } = await anon
		.from("profiles")
		.select("user_id, display_name")
		.in("user_id", userIds)
	if (error) throw error
	const map = new Map<string, { userId: string; displayName: string }>()
	for (const r of (data || []) as any[]) {
		map.set(r.user_id as string, { userId: r.user_id, displayName: r.display_name })
	}
	return map
}

async function fetchUpvoteCounts(projectIds: string[], anon: ReturnType<typeof getAnonServerClient>) {
	const map = new Map<string, number>()
	if (projectIds.length === 0) return map
	const { data, error } = await anon.from("project_upvotes").select("project_id").in("project_id", projectIds)
	if (error) throw error
	for (const pid of projectIds) map.set(pid, 0)
	for (const r of (data || []) as any[]) {
		const pid = r.project_id as string
		map.set(pid, (map.get(pid) || 0) + 1)
	}
	return map
}


async function fetchCommentsByProjectId(projectId: string, anon: ReturnType<typeof getAnonServerClient>): Promise<Comment[]> {
	// Fetch comments for a project (newest first)
	const { data: rows, error } = await anon
		.from("comments")
		.select("id, project_id, author_id, body, created_at, soft_deleted")
		.eq("project_id", projectId)
		.eq("soft_deleted", false)
		.order("created_at", { ascending: false })

	if (error) throw error
	const commentRows = (rows || []) as any[]
	if (commentRows.length === 0) return []

	// Load author profiles
	const authorIds = Array.from(new Set(commentRows.map((r) => r.author_id as string)))
	const authors = await fetchOwnersByUserIds(authorIds, anon)

	const items: Comment[] = commentRows.map((r) => {
		const profile = authors.get(r.author_id as string)
		const author: Profile = {
			userId: profile?.userId || (r.author_id as string),
			displayName: profile?.displayName || "User",
		}
		return {
			id: r.id as string,
			projectId: r.project_id as string,
			authorId: r.author_id as string,
			author,
			body: r.body as string,
			createdAt: new Date(r.created_at as string),
			softDeleted: undefined,
		}
	})

	return items
}

export async function addComment(projectId: string, body: string): Promise<{ id: string } | { error: string }> {
	const supabase = await getServerSupabase()
	const { data: auth } = await supabase.auth.getUser()
	if (!auth.user) return { error: "unauthorized" }

	const parsed = commentSchema.safeParse({ body })
	if (!parsed.success) {
		const first = parsed.error.issues[0]
		return { error: first?.message || "invalid_input" }
	}

	const { data, error } = await supabase
		.from("comments")
		.insert({ project_id: projectId, author_id: auth.user.id, body: parsed.data.body })
		.select("id")
		.single()

	if (error || !data) return { error: error?.message || "failed_to_add_comment" }
	return { id: data.id as string }
}

export async function deleteComment(commentId: string): Promise<{ ok: true } | { error: string }> {
	const supabase = await getServerSupabase()
	const { data: auth } = await supabase.auth.getUser()
	if (!auth.user) return { error: "unauthorized" }

	const { error } = await supabase.from("comments").delete().eq("id", commentId)
	if (error) return { error: error.message }
	return { ok: true }
}


