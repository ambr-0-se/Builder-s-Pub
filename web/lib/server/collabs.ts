"use server"

import { createClient } from "@supabase/supabase-js"
import { getServerSupabase } from "@/lib/supabaseServer"
import type { Profile, Tag } from "@/lib/types"
import { createCollabSchema, type CreateCollabInput, updateCollabSchema, type UpdateCollabInput, collabCommentSchema } from "@/app/collaborations/schema"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

function getAnonServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

export interface CollaborationRow {
  id: string
  owner_id: string
  kind: string
  title: string
  description: string
  affiliated_org: string | null
  project_type: string | null
  project_types?: string[] | null
  stage: string | null
  looking_for: any | null
  contact: string | null
  remarks: string | null
  created_at: string
  soft_deleted: boolean
  is_hiring?: boolean
}

export interface CollaborationWithRelations {
  collaboration: {
    id: string
    ownerId: string
    kind: "ongoing" | "planned" | "individual" | "organization"
    title: string
    description: string
    affiliatedOrg?: string
    projectType?: string
    projectTypes?: string[]
    stage?: string
    isHiring?: boolean
    lookingFor: Array<{ role: string; amount?: number; prerequisite?: string; goodToHave?: string; description?: string }>
    contact: string
    remarks?: string
    createdAt: Date
  }
  tags: { technology: Tag[]; category: Tag[] }
  upvoteCount: number
  owner: Profile
  hasUserUpvoted?: boolean
  commentCount?: number
  comments?: import("@/lib/types").Comment[]
}

export async function createCollab(input: CreateCollabInput): Promise<{ id: string } | { fieldErrors?: Record<string, string>; formError?: string }> {
  const supabase = await getServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { formError: "unauthorized" }

  const parsed = createCollabSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { fieldErrors }
  }

  const {
    title,
    affiliatedOrg,
    // kind removed from UI; keep back-compat default
    projectTypes,
    description,
    stage,
    lookingFor,
    contact,
    remarks,
    techTagIds,
    categoryTagIds,
  } = parsed.data

  const { data: row, error } = await supabase
    .from("collaborations")
    .insert({
      owner_id: auth.user.id,
      title,
      kind: "ongoing",
      description,
      affiliated_org: affiliatedOrg || null,
      project_types: (projectTypes as any) || null,
      stage,
      looking_for: lookingFor as any,
      contact,
      remarks: remarks || null,
    })
    .select("id")
    .single()

  if (error || !row) return { formError: error?.message || "failed_to_create_collab" }

  const collabId: string = row.id
  const allTagIds = [...new Set([...(techTagIds || []), ...(categoryTagIds || [])])]
  if (allTagIds.length > 0) {
    const tagRows = allTagIds.map((tagId) => ({ collaboration_id: collabId, tag_id: tagId }))
    const { error: tagErr } = await supabase.from("collaboration_tags").insert(tagRows)
    if (tagErr) {
      await supabase.from("collaborations").delete().eq("id", collabId)
      return { formError: tagErr.message }
    }
  }

  return { id: collabId }
}

export interface ListCollabsParams {
  cursor?: string
  limit?: number
  kind?: "ongoing" | "planned" | "individual" | "organization"
  skills?: string
  includeClosed?: boolean
}

export async function listCollabs(params: ListCollabsParams = {}): Promise<{ items: CollaborationWithRelations[]; nextCursor?: string }> {
  const anon = getAnonServerClient()
  const limit = params.limit && params.limit > 0 ? params.limit : 20

  async function fetchRows(selectCols: string) {
    let query = anon.from("collaborations").select(selectCols).eq("soft_deleted", false)
    if (params.kind) query = query.eq("kind", params.kind)
    // Placeholder: skills filter to be implemented server-side post-fetch (todo tracked)
    const { data, error } = await query.order("created_at", { ascending: false }).limit(limit)
    if (error) throw error
    return data as any[]
  }

  let rows: any[] = []
  try {
    rows = await fetchRows("id, owner_id, kind, title, description, affiliated_org, project_type, project_types, stage, looking_for, contact, remarks, created_at, soft_deleted, is_hiring")
  } catch (e: any) {
    // Fallback for environments where migration hasn't run yet (missing columns)
    if (e && (e.code === "42703" || /column .* does not exist/i.test(String(e.message || "")))) {
      rows = await fetchRows("id, owner_id, kind, title, description, created_at, soft_deleted")
    } else {
      throw e
    }
  }
  if (!rows || rows.length === 0) return { items: [] }

  // Server-side substring matching over looking_for role/prerequisite/goodToHave/description (case-insensitive)
  let filtered = rows
  if (params.skills && params.skills.trim() !== "") {
    const needle = params.skills.trim().toLowerCase()
    filtered = rows.filter((r: any) => {
      const arr: any[] = Array.isArray(r.looking_for) ? r.looking_for : []
      for (const it of arr) {
        const role = String((it && it.role) || "").toLowerCase()
        const pre = String((it && it.prerequisite) || "").toLowerCase()
        const good = String((it && it.goodToHave) || "").toLowerCase()
        const desc = String((it && it.description) || "").toLowerCase()
        if (role.includes(needle) || pre.includes(needle) || good.includes(needle) || desc.includes(needle)) return true
      }
      return false
    })
  }

  // Default hide closed unless includeClosed is true; tolerate environments without is_hiring column
  if (!params.includeClosed) {
    filtered = filtered.filter((r: any) => r.is_hiring !== false)
  }

  const collabIds = (filtered as any[]).map((r) => r.id as string)
  const [tagsByCollab, ownersByUser, upvoteCounts] = await Promise.all([
    fetchTagsByCollabIds(collabIds, anon),
    fetchOwnersByUserIds((rows as any[]).map((r) => r.owner_id as string), anon),
    fetchUpvoteCounts(collabIds, anon),
  ])

  const supabase = await getServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const currentUserId = auth.user?.id || null
  const userUpvotes = await fetchUserCollabUpvotes(collabIds, currentUserId, anon)

  const items: CollaborationWithRelations[] = (filtered as any[]).map((r) => {
    return toCollabWithRelations(r as CollaborationRow, tagsByCollab.get(r.id) || { technology: [], category: [] }, ownersByUser.get(r.owner_id), upvoteCounts.get(r.id) || 0, userUpvotes.get(r.id) || false)
  })

  return { items }
}

export async function getCollab(id: string): Promise<CollaborationWithRelations | null> {
  const anon = getAnonServerClient()
  async function fetchOne(selectCols: string) {
    const { data, error } = await anon.from("collaborations").select(selectCols).eq("id", id).maybeSingle()
    if (error) throw error
    return data as any
  }
  let r: any = null
  try {
    r = await fetchOne("id, owner_id, kind, title, description, affiliated_org, project_type, project_types, stage, looking_for, contact, remarks, created_at, soft_deleted, is_hiring")
  } catch (e: any) {
    if (e && (e.code === "42703" || /column .* does not exist/i.test(String(e.message || "")))) {
      r = await fetchOne("id, owner_id, kind, title, description, created_at, soft_deleted")
    } else {
      throw e
    }
  }
  if (!r || r.soft_deleted) return null

  const supabase = await getServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const currentUserId = auth.user?.id || null

  const [tags, owner, voteCounts, userUpvotes, commentCount, comments] = await Promise.all([
    fetchTagsByCollabIds([r.id], anon),
    fetchOwnersByUserIds([r.owner_id], anon),
    fetchUpvoteCounts([r.id], anon),
    fetchUserCollabUpvotes([r.id], currentUserId, anon),
    fetchCommentCount([r.id], anon),
    fetchCollabComments(r.id, anon, currentUserId),
  ])

  const result = toCollabWithRelations(r as CollaborationRow, tags.get(r.id) || { technology: [], category: [] }, owner.get(r.owner_id), voteCounts.get(r.id) || 0, userUpvotes.get(r.id) || false, commentCount.get(r.id) || 0)
  result.comments = comments
  return result
}

export async function updateCollab(id: string, fields: UpdateCollabInput): Promise<{ ok: true } | { fieldErrors?: Record<string, string>; formError?: string }> {
  const supabase = await getServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { formError: "unauthorized" }

  const parsed = updateCollabSchema.safeParse(fields)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { fieldErrors }
  }

  const update: any = {}
  const allowed = ["title", "affiliatedOrg", "description", "stage", "lookingFor", "contact", "remarks", "isHiring"] as const
  for (const k of allowed) {
    if ((parsed.data as any)[k] !== undefined) {
      const colMap: Record<string, string> = {
        title: "title",
        affiliatedOrg: "affiliated_org",
        description: "description",
        stage: "stage",
        lookingFor: "looking_for",
        contact: "contact",
        remarks: "remarks",
        isHiring: "is_hiring",
      }
      update[colMap[k as unknown as string]] = (parsed.data as any)[k]
    }
  }

  const { error } = await supabase.from("collaborations").update(update).eq("id", id)
  if (error) return { formError: error.message }
  return { ok: true }
}

export async function deleteCollab(id: string): Promise<{ ok: true } | { formError: string }> {
  const supabase = await getServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { formError: "unauthorized" }
  const { error } = await supabase.from("collaborations").update({ soft_deleted: true }).eq("id", id)
  if (error) return { formError: error.message }
  return { ok: true }
}

export async function toggleCollabUpvote(collaborationId: string): Promise<{ ok: true; upvoted: boolean } | { error: string; retryAfterSec?: number }> {
  const supabase = await getServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { error: "unauthorized" }

  // Simple throttle using existing rate_limits table (same bucket as projects)
  const rl = await checkRateLimit(supabase, { action: "upvote_toggle", userId: auth.user.id, limit: 10, windowSec: 60 })
  if (rl.limited) return { error: "rate_limited", retryAfterSec: rl.retryAfterSec }

  const { data: existing, error: checkErr } = await supabase
    .from("collaboration_upvotes")
    .select("collaboration_id")
    .eq("collaboration_id", collaborationId)
    .eq("user_id", auth.user.id)
    .maybeSingle()
  if (checkErr) return { error: checkErr.message }

  if (existing) {
    const { error: delErr } = await supabase
      .from("collaboration_upvotes")
      .delete()
      .eq("collaboration_id", collaborationId)
      .eq("user_id", auth.user.id)
    if (delErr) return { error: delErr.message }
    return { ok: true, upvoted: false }
  }

  const { error: insErr } = await supabase
    .from("collaboration_upvotes")
    .insert({ collaboration_id: collaborationId, user_id: auth.user.id })
  if (insErr) return { error: insErr.message }
  return { ok: true, upvoted: true }
}

export async function addCollabComment(collaborationId: string, body: string, parentCommentId?: string): Promise<{ id: string } | { error: string; retryAfterSec?: number }> {
  const supabase = await getServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { error: "unauthorized" }

  const parsed = collabCommentSchema.safeParse({ body })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first?.message || "invalid_input" }
  }

  const rl = await checkRateLimit(supabase, { action: "comment_add", userId: auth.user.id, limit: 5, windowSec: 60 })
  if (rl.limited) return { error: "rate_limited", retryAfterSec: rl.retryAfterSec }

  // If replying, ensure parent exists and belongs to same collaboration and is top-level
  if (parentCommentId) {
    const { data: parent, error: parentErr } = await supabase
      .from("collab_comments")
      .select("collaboration_id, parent_comment_id, soft_deleted")
      .eq("id", parentCommentId)
      .maybeSingle()
    if (parentErr) return { error: parentErr.message }
    if (!parent || parent.soft_deleted) return { error: "not_found" }
    if (parent.collaboration_id !== collaborationId) return { error: "invalid_parent_collaboration" }
    if (parent.parent_comment_id) return { error: "invalid_parent_depth" }
  }

  const { data, error } = await supabase
    .from("collab_comments")
    .insert({ collaboration_id: collaborationId, author_id: auth.user.id, body: parsed.data.body, parent_comment_id: parentCommentId || null })
    .select("id")
    .single()
  if (error || !data) return { error: error?.message || "failed_to_add_comment" }
  return { id: data.id as string }
}

export async function deleteCollabComment(commentId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await getServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { error: "unauthorized" }
  const { error } = await supabase.from("collab_comments").delete().eq("id", commentId)
  if (error) return { error: error.message }
  return { ok: true }
}

function toCollabWithRelations(
  row: CollaborationRow,
  tags: { technology: Tag[]; category: Tag[] },
  owner: { userId: string; displayName: string } | undefined,
  upvoteCount: number,
  hasUserUpvoted: boolean,
  commentCount?: number
): CollaborationWithRelations {
  return {
    collaboration: {
      id: row.id,
      ownerId: row.owner_id,
      kind: row.kind as any,
      title: row.title,
      description: row.description,
      affiliatedOrg: row.affiliated_org || undefined,
      projectType: row.project_type || undefined,
      projectTypes: Array.isArray((row as any).project_types) ? ((row as any).project_types as string[]) : undefined,
      isHiring: (row as any).is_hiring !== false,
      stage: row.stage || undefined,
      lookingFor: Array.isArray(row.looking_for)
        ? (row.looking_for as any[]).map((it: any) => ({
            role: String(it?.role || ""),
            amount: typeof it?.amount === "number" ? it.amount : undefined,
            prerequisite: it?.prerequisite ? String(it.prerequisite) : undefined,
            goodToHave: it?.goodToHave ? String(it.goodToHave) : undefined,
            description: it?.description ? String(it.description) : undefined,
          }))
        : [],
      contact: row.contact || "",
      remarks: row.remarks || undefined,
      createdAt: new Date(row.created_at),
    },
    tags,
    upvoteCount,
    owner: {
      userId: owner?.userId || row.owner_id,
      displayName: owner?.displayName || "User",
    },
    hasUserUpvoted,
    commentCount,
  }
}

async function fetchTagsByCollabIds(collabIds: string[], anon: ReturnType<typeof getAnonServerClient>) {
  if (collabIds.length === 0) return new Map<string, { technology: Tag[]; category: Tag[] }>()
  const { data: rows, error } = await anon
    .from("collaboration_tags")
    .select("collaboration_id, tag_id")
    .in("collaboration_id", collabIds)
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
    const id = row.collaboration_id as string
    const tag = tagsById.get(row.tag_id as number)
    if (!tag) continue
    if (!map.has(id)) map.set(id, { technology: [], category: [] })
    const bucket = tag.type === "category" ? "category" : "technology"
    map.get(id)![bucket].push(tag)
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

async function fetchUpvoteCounts(ids: string[], anon: ReturnType<typeof getAnonServerClient>) {
  const map = new Map<string, number>()
  if (ids.length === 0) return map
  const { data, error } = await anon.from("collaboration_upvotes").select("collaboration_id").in("collaboration_id", ids)
  if (error) throw error
  for (const id of ids) map.set(id, 0)
  for (const r of (data || []) as any[]) {
    const id = r.collaboration_id as string
    map.set(id, (map.get(id) || 0) + 1)
  }
  return map
}

async function fetchUserCollabUpvotes(ids: string[], userId: string | null, anon: ReturnType<typeof getAnonServerClient>) {
  const map = new Map<string, boolean>()
  if (ids.length === 0 || !userId) return map
  const { data, error } = await anon
    .from("collaboration_upvotes")
    .select("collaboration_id")
    .in("collaboration_id", ids)
    .eq("user_id", userId)
  if (error) throw error
  for (const r of (data || []) as any[]) {
    map.set(r.collaboration_id as string, true)
  }
  return map
}

async function fetchCommentCount(ids: string[], anon: ReturnType<typeof getAnonServerClient>) {
  const map = new Map<string, number>()
  if (ids.length === 0) return map
  const { data, error } = await anon
    .from("collab_comments")
    .select("collaboration_id")
    .in("collaboration_id", ids)
  if (error) throw error
  for (const id of ids) map.set(id, 0)
  for (const r of (data || []) as any[]) {
    map.set(r.collaboration_id as string, (map.get(r.collaboration_id as string) || 0) + 1)
  }
  return map
}

async function fetchCollabComments(collaborationId: string, anon: ReturnType<typeof getAnonServerClient>, currentUserId: string | null) {
  const { data: topRows, error: topErr } = await anon
    .from("collab_comments")
    .select("id, collaboration_id, author_id, body, created_at, soft_deleted")
    .eq("collaboration_id", collaborationId)
    .is("parent_comment_id", null)
    .eq("soft_deleted", false)
    .order("created_at", { ascending: false })
  if (topErr) {
    if (topErr.code === "42P01" || /relation .* does not exist/i.test(String(topErr.message || ""))) return []
    throw topErr
  }
  const parentIds = (topRows || []).map((r: any) => r.id as string)
  let replyMap = new Map<string, any[]>()
  if (parentIds.length > 0) {
    const { data: replyRows, error: repErr } = await anon
      .from("collab_comments")
      .select("id, collaboration_id, author_id, body, created_at, soft_deleted, parent_comment_id")
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

  const toComment = (r: any) => {
    const profile = authors.get(r.author_id as string)
    return {
      id: r.id as string,
      projectId: "",
      authorId: r.author_id as string,
      author: { userId: profile?.userId || (r.author_id as string), displayName: profile?.displayName || "User" },
      body: r.body as string,
      createdAt: new Date(r.created_at as string),
      parentCommentId: (r.parent_comment_id as string) || null,
    }
  }
  const parents = (topRows || []).map(toComment)
  // attach replies oldest->latest
  for (const p of parents) {
    const replies = (replyMap.get(p.id) || []).map(toComment)
    ;(p as any).children = replies
  }
  return parents as any
}

// Shared rate limit helper (copied from projects.ts to avoid cross-imports)
async function checkRateLimit(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  {
    action,
    userId,
    limit,
    windowSec,
  }: { action: string; userId: string; limit: number; windowSec: number }
): Promise<{ limited: boolean; retryAfterSec?: number }> {
  const nowMs = Date.now()
  const windowMs = windowSec * 1000
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs
  const windowStartIso = new Date(windowStartMs).toISOString()

  const { data: existing } = await (supabase as any)
    .from("rate_limits")
    .select("count")
    .eq("action", action)
    .eq("user_id", userId)
    .eq("window_start", windowStartIso)
    .maybeSingle()
  const current = existing?.count ? Number(existing.count) : 0
  if (current >= limit) {
    const retryAfterSec = Math.ceil((windowStartMs + windowMs - nowMs) / 1000)
    return { limited: true, retryAfterSec }
  }
  const nextCount = current + 1
  await (supabase as any)
    .from("rate_limits")
    .upsert({ action, user_id: userId, window_start: windowStartIso, count: nextCount }, { onConflict: "action,user_id,window_start" })
  return { limited: false }
}


