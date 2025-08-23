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
			.map((p: any) => toProjectWithRelations(p, tagsByProject.get(p.id) || { technology: [], category: [] }, ownersByUser.get(p.owner_id), countMap.get(p.id) || 0, [], false))
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
		toProjectWithRelations(p, tagsByProject.get(p.id) || { technology: [], category: [] }, ownersByUser.get(p.owner_id), voteCounts.get(p.id) || 0, [], false)
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

	// Get current user for upvote state
	const supabase = await getServerSupabase()
	const { data: auth } = await supabase.auth.getUser()
	const currentUserId = auth.user?.id || null

	const [tags, owner, voteCount, userProjectUpvotes] = await Promise.all([
		fetchTagsByProjectIds([p.id], anon),
		fetchOwnersByUserIds([p.owner_id], anon),
		fetchUpvoteCounts([p.id], anon),
		fetchUserProjectUpvotes([p.id], currentUserId, anon),
	])

	let comments: Comment[] = []
	try {
		comments = await fetchThreadedComments(p.id, anon, currentUserId)
	} catch (e: any) {
		// Fallback for environments where migration hasn't run yet (missing columns/tables)
		if (e && (e.code === "42703" || /column .* does not exist/i.test(String(e.message || "")))) {
			comments = await fetchFlatComments(p.id, anon, currentUserId)
		} else {
			throw e
		}
	}

	const tagMap = tags.get(p.id) || { technology: [], category: [] }
	const ownerProfile = owner.get(p.owner_id)
	const upvotes = voteCount.get(p.id) || 0
	const hasUserUpvoted = userProjectUpvotes.get(p.id) || false

	return toProjectWithRelations(p as any, tagMap, ownerProfile, upvotes, comments, hasUserUpvoted)
}

function toProjectWithRelations(
	row: any,
	tags: { technology: Tag[]; category: Tag[] },
 	owner: { userId: string; displayName: string } | undefined,
 	upvoteCount: number,
 	comments: Comment[] = [],
 	hasUserUpvoted: boolean
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
		hasUserUpvoted,
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

async function fetchUserProjectUpvotes(projectIds: string[], userId: string | null, anon: ReturnType<typeof getAnonServerClient>) {
	const map = new Map<string, boolean>()
	if (projectIds.length === 0 || !userId) return map
	const { data, error } = await anon
		.from("project_upvotes")
		.select("project_id")
		.in("project_id", projectIds)
		.eq("user_id", userId)
	if (error) throw error
	for (const r of (data || []) as any[]) {
		const pid = r.project_id as string
		map.set(pid, true)
	}
	return map
}

async function fetchUserCommentUpvotes(commentIds: string[], userId: string | null, anon: ReturnType<typeof getAnonServerClient>) {
	const map = new Map<string, boolean>()
	if (commentIds.length === 0 || !userId) return map
	const { data, error } = await anon
		.from("comment_upvotes")
		.select("comment_id")
		.in("comment_id", commentIds)
		.eq("user_id", userId)
	if (error) throw error
	for (const r of (data || []) as any[]) {
		const cid = r.comment_id as string
		map.set(cid, true)
	}
	return map
}

async function fetchThreadedComments(projectId: string, anon: ReturnType<typeof getAnonServerClient>, currentUserId: string | null): Promise<Comment[]> {
	const { data: topRows, error: topErr } = await anon
		.from("comments")
		.select("id, project_id, author_id, body, created_at, soft_deleted")
		.eq("project_id", projectId)
		.is("parent_comment_id", null)
		.eq("soft_deleted", false)
		.order("created_at", { ascending: false })
	if (topErr) throw topErr
	const parentIds = (topRows || []).map((r: any) => r.id as string)

	let replyMap = new Map<string, any[]>()
	if (parentIds.length > 0) {
		const { data: replyRows, error: repErr } = await anon
			.from("comments")
			.select("id, project_id, author_id, body, created_at, soft_deleted, parent_comment_id")
			.in("parent_comment_id", parentIds)
			.eq("soft_deleted", false)
			.order("created_at", { ascending: true })
		if (repErr) throw repErr
		for (const r of (replyRows || []) as any[]) {
			const pid = r.parent_comment_id as string
			if (!replyMap.has(pid)) replyMap.set(pid, [])
			replyMap.get(pid)!.push(r)
		}
	}

	const authorIds = Array.from(new Set([...(topRows || []), ...Array.from(replyMap.values()).flat()].map((r: any) => r.author_id as string)))
	const authors = await fetchOwnersByUserIds(authorIds, anon)

	const allCommentIds = [...parentIds, ...Array.from(replyMap.values()).flat().map((r: any) => r.id as string)]
	const upvoteCounts = await fetchCommentUpvoteCounts(allCommentIds, anon)

	const toComment = (r: any): Comment => {
		const profile = authors.get(r.author_id as string)
		const author: Profile = { userId: profile?.userId || (r.author_id as string), displayName: profile?.displayName || "User" }
		return {
			id: r.id as string,
			projectId: r.project_id as string,
			authorId: r.author_id as string,
			author,
			body: r.body as string,
			createdAt: new Date(r.created_at as string),
			softDeleted: undefined,
			parentCommentId: (r.parent_comment_id as string) || null,
			upvoteCount: upvoteCounts.get(r.id as string) || 0,
			hasUserUpvoted: false, // Will be set after fetching user upvotes
		}
	}

	const parents = (topRows || []).map((p: any) => {
		const parent = toComment(p)
		const replies = (replyMap.get(p.id as string) || []).map(toComment)
		parent.children = replies
		return parent
	})

	// Fetch user upvote states for all comments
	if (currentUserId) {
		const userUpvotes = await fetchUserCommentUpvotes(allCommentIds, currentUserId, anon)
		// Update hasUserUpvoted for all comments and replies
		const updateUpvoteState = (comment: Comment) => {
			comment.hasUserUpvoted = userUpvotes.get(comment.id) || false
			if (comment.children) {
				comment.children.forEach(updateUpvoteState)
			}
		}
		parents.forEach(updateUpvoteState)
	}

	return parents
}

async function fetchCommentUpvoteCounts(commentIds: string[], anon: ReturnType<typeof getAnonServerClient>) {
	const map = new Map<string, number>()
	if (commentIds.length === 0) return map
	const { data, error } = await anon.from("comment_upvotes").select("comment_id").in("comment_id", commentIds)
	if (error) throw error
	for (const id of commentIds) map.set(id, 0)
	for (const r of (data || []) as any[]) {
		const id = r.comment_id as string
		map.set(id, (map.get(id) || 0) + 1)
	}
	return map
}

// Backwards-compatible flat fetch (no replies, no counts)
async function fetchFlatComments(projectId: string, anon: ReturnType<typeof getAnonServerClient>, currentUserId: string | null): Promise<Comment[]> {
	const { data: rows, error } = await anon
		.from("comments")
		.select("id, project_id, author_id, body, created_at, soft_deleted")
		.eq("project_id", projectId)
		.eq("soft_deleted", false)
		.order("created_at", { ascending: false })
	if (error) throw error
	const commentRows = (rows || []) as any[]
	if (commentRows.length === 0) return []
	const authorIds = Array.from(new Set(commentRows.map((r) => r.author_id as string)))
	const authors = await fetchOwnersByUserIds(authorIds, anon)
	const hasUserUpvotedMap = currentUserId ? await fetchUserCommentUpvotes(commentRows.map((r) => r.id), currentUserId, anon) : new Map<string, boolean>()
	return commentRows.map((r) => {
		const profile = authors.get(r.author_id as string)
		const author: Profile = { userId: profile?.userId || (r.author_id as string), displayName: profile?.displayName || "User" }
		const hasUserUpvoted = hasUserUpvotedMap.get(r.id) || false
		return {
			id: r.id as string,
			projectId: r.project_id as string,
			authorId: r.author_id as string,
			author,
			body: r.body as string,
			createdAt: new Date(r.created_at as string),
			softDeleted: undefined,
			parentCommentId: null,
			upvoteCount: 0,
			hasUserUpvoted,
		}
	})
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


// --- Replies (1-level) ---
export async function addReply(projectId: string, parentCommentId: string, body: string): Promise<{ id: string } | { error: string }> {
	const supabase = await getServerSupabase()
	const { data: auth } = await supabase.auth.getUser()
	if (!auth.user) return { error: "unauthorized" }

	const parsed = commentSchema.safeParse({ body })
	if (!parsed.success) {
		const first = parsed.error.issues[0]
		return { error: first?.message || "invalid_input" }
	}

	// Validate parent: must exist, belong to the same project, and be top-level (no parent of its own)
	const { data: parent, error: parentErr } = await supabase
		.from("comments")
		.select("project_id, parent_comment_id, soft_deleted")
		.eq("id", parentCommentId)
		.maybeSingle()
	if (parentErr) return { error: parentErr.message }
	if (!parent || parent.soft_deleted) return { error: "not_found" }
	if (parent.project_id !== projectId) return { error: "invalid_parent_project" }
	if (parent.parent_comment_id) return { error: "invalid_parent_depth" }

	const { data, error } = await supabase
		.from("comments")
		.insert({ project_id: projectId, author_id: auth.user.id, body: parsed.data.body, parent_comment_id: parentCommentId })
		.select("id")
		.single()
	if (error || !data) return { error: error?.message || "failed_to_add_reply" }
	return { id: data.id as string }
}

// --- Upvotes (toggle) ---
export async function toggleProjectUpvote(projectId: string): Promise<{ ok: true; upvoted: boolean } | { error: string }> {
	const supabase = await getServerSupabase()
	const { data: auth } = await supabase.auth.getUser()
	if (!auth.user) return { error: "unauthorized" }

	// Check if already upvoted
	const { data: existing, error: checkErr } = await supabase
		.from("project_upvotes")
		.select("project_id")
		.eq("project_id", projectId)
		.eq("user_id", auth.user.id)
		.maybeSingle()
	if (checkErr) return { error: checkErr.message }

	if (existing) {
		const { error: delErr } = await supabase
			.from("project_upvotes")
			.delete()
			.eq("project_id", projectId)
			.eq("user_id", auth.user.id)
		if (delErr) return { error: delErr.message }
		return { ok: true, upvoted: false }
	}

	const { error: insErr } = await supabase.from("project_upvotes").insert({ project_id: projectId, user_id: auth.user.id })
	if (insErr) return { error: insErr.message }
	return { ok: true, upvoted: true }
}

export async function toggleCommentUpvote(commentId: string): Promise<{ ok: true; upvoted: boolean } | { error: string }> {
	const supabase = await getServerSupabase()
	const { data: auth } = await supabase.auth.getUser()
	if (!auth.user) return { error: "unauthorized" }

	const { data: existing, error: checkErr } = await supabase
		.from("comment_upvotes")
		.select("comment_id")
		.eq("comment_id", commentId)
		.eq("user_id", auth.user.id)
		.maybeSingle()
	if (checkErr) return { error: checkErr.message }

	if (existing) {
		const { error: delErr } = await supabase
			.from("comment_upvotes")
			.delete()
			.eq("comment_id", commentId)
			.eq("user_id", auth.user.id)
		if (delErr) return { error: delErr.message }
		return { ok: true, upvoted: false }
	}

	const { error: insErr } = await supabase.from("comment_upvotes").insert({ comment_id: commentId, user_id: auth.user.id })
	if (insErr) return { error: insErr.message }
	return { ok: true, upvoted: true }
}

