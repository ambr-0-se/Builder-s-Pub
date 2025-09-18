"use server"

import { redirect } from "next/navigation"
import { createCollab, updateCollab, deleteCollab, addCollabComment, deleteCollabComment, toggleCollabUpvote } from "@/lib/server/collabs"
import { createCollabSchema, updateCollabSchema, collabCommentSchema } from "@/app/collaborations/schema"
import { trackServer } from "@/lib/analytics"
import { requestCollabLogoUpload, setCollabLogo } from "@/lib/server/collabs"

export type CreateCollabState = { fieldErrors?: Record<string, string>; formError?: string } | null

export async function createCollabAction(_: CreateCollabState, formData: FormData): Promise<CreateCollabState> {
  // Collect tags (multi-value inputs)
  const techTagIds = formData
    .getAll("techTagIds")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n))
  const categoryTagIds = formData
    .getAll("categoryTagIds")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n))

  // Collect "looking for" rows as parallel arrays and zip
  const roles = formData.getAll("lf_role").map((v) => String(v))
  const amounts = formData.getAll("lf_amount").map((v) => Number(v))
  const prereqs = formData.getAll("lf_prerequisite").map((v) => String(v))
  const goods = formData.getAll("lf_goodToHave").map((v) => String(v))
  const descs = formData.getAll("lf_description").map((v) => String(v))
  const maxLen = Math.max(roles.length, amounts.length, prereqs.length, goods.length, descs.length)
  const lookingFor = Array.from({ length: maxLen }).map((_, i) => ({
    role: (roles[i] || "").trim(),
    amount: Number.isFinite(amounts[i]) && amounts[i] > 0 ? Number(amounts[i]) : 1,
    prerequisite: (prereqs[i] || "").trim(),
    goodToHave: (goods[i] || "").trim(),
    description: (descs[i] || "").trim(),
  }))
  // Remove empty rows (missing role)
  const lookingForFiltered = lookingFor.filter((r) => r.role.length > 0)

  const parsed = createCollabSchema.safeParse({
    title: String(formData.get("title") || ""),
    affiliatedOrg: String(formData.get("affiliatedOrg") || ""),
    projectTypes: formData.getAll("projectTypes").map((v) => String(v)),
    description: String(formData.get("description") || ""),
    stage: String(formData.get("stage") || ""),
    lookingFor: lookingForFiltered,
    contact: String(formData.get("contact") || ""),
    remarks: String(formData.get("remarks") || ""),
    techTagIds,
    categoryTagIds,
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { fieldErrors }
  }

  const result = await createCollab(parsed.data)
  if ("id" in result) {
    trackServer("collaboration_created", { id: result.id, roles: parsed.data.lookingFor.length })
    redirect(`/collaborations/${result.id}?created=1`)
  }
  return result
}

export type UpdateCollabState = { fieldErrors?: Record<string, string>; formError?: string; ok?: true } | null

export async function updateCollabAction(_: UpdateCollabState, formData: FormData): Promise<UpdateCollabState> {
  const id = String(formData.get("id") || "").trim()
  if (!id) return { formError: "Missing collaboration id" }

  // Same collection strategy as create, but all fields optional
  const techTagIds = formData
    .getAll("techTagIds")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n))
  const categoryTagIds = formData
    .getAll("categoryTagIds")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n))

  const roles = formData.getAll("lf_role").map((v) => String(v))
  const prereqs = formData.getAll("lf_prerequisite").map((v) => String(v))
  const goods = formData.getAll("lf_goodToHave").map((v) => String(v))
  const descs = formData.getAll("lf_description").map((v) => String(v))
  let lookingFor: Array<{ role: string; prerequisite?: string; goodToHave?: string; description?: string }> | undefined
  if (roles.length + prereqs.length + goods.length + descs.length > 0) {
    const maxLen = Math.max(roles.length, prereqs.length, goods.length, descs.length)
    lookingFor = Array.from({ length: maxLen })
      .map((_, i) => ({
        role: (roles[i] || "").trim(),
        prerequisite: (prereqs[i] || "").trim(),
        goodToHave: (goods[i] || "").trim(),
        description: (descs[i] || "").trim(),
      }))
      .filter((r) => r.role.length > 0)
  }

  const candidate = {
    title: String(formData.get("title") || undefined),
    affiliatedOrg: String(formData.get("affiliatedOrg") || undefined),
    kind: (formData.get("kind") ? String(formData.get("kind")) : undefined) as any,
    projectType: (formData.get("projectType") ? String(formData.get("projectType")) : undefined) as any,
    description: String(formData.get("description") || undefined),
    stage: (formData.get("stage") ? String(formData.get("stage")) : undefined) as any,
    lookingFor,
    contact: String(formData.get("contact") || undefined),
    remarks: String(formData.get("remarks") || undefined),
    // Note: tags update handled separately in UI flow (could be added later)
  }

  // Optional isHiring toggle
  const isHiringRaw = formData.get("isHiring")
  if (typeof isHiringRaw === "string") (candidate as any).isHiring = isHiringRaw === "true"

  const parsed = updateCollabSchema.safeParse(candidate)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { fieldErrors }
  }

  const result = await updateCollab(id, parsed.data)
  if ("ok" in result) {
    trackServer("collaboration_updated", { id })
    return { ok: true }
  }
  return result
}

export type DeleteCollabState = { formError?: string; ok?: true } | null

export async function deleteCollabAction(_: DeleteCollabState, formData: FormData): Promise<DeleteCollabState> {
  const id = String(formData.get("id") || "").trim()
  if (!id) return { formError: "Missing collaboration id" }
  const result = await deleteCollab(id)
  if ("ok" in result) {
    trackServer("collaboration_deleted", { id })
    redirect("/collaborations")
  }
  return result
}

export type ToggleUpvoteState = { formError?: string; ok?: true; upvoted?: boolean; retryAfterSec?: number } | null

export async function toggleCollabUpvoteAction(_: ToggleUpvoteState, formData: FormData): Promise<ToggleUpvoteState> {
  const collaborationId = String(formData.get("collaborationId") || "").trim()
  if (!collaborationId) return { formError: "Missing collaboration id" }
  const result = await toggleCollabUpvote(collaborationId)
  if ("ok" in result) {
    trackServer("upvote_toggled", { target: "collaboration", targetId: collaborationId, upvoted: result.upvoted })
    return { ok: true, upvoted: result.upvoted }
  }
  if ((result as any).error === "rate_limited") return { formError: "Too many upvotes. Please slow down.", retryAfterSec: (result as any).retryAfterSec }
  trackServer("upvote_toggled", { target: "collaboration", targetId: collaborationId, error: (result as any).error })
  return { formError: (result as any).error || "failed_to_toggle_upvote" }
}

export type AddCollabCommentState = { fieldErrors?: Record<string, string>; formError?: string; ok?: true; retryAfterSec?: number } | null

export async function addCollabCommentAction(_: AddCollabCommentState, formData: FormData): Promise<AddCollabCommentState> {
  const collaborationId = String(formData.get("collaborationId") || "").trim()
  const body = String(formData.get("body") || "")
  const parentCommentId = String(formData.get("parentCommentId") || "").trim()
  const fieldErrors: Record<string, string> = {}
  if (!collaborationId) fieldErrors.collaborationId = "Missing collaboration id"

  const parsed = collabCommentSchema.safeParse({ body })
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { fieldErrors }
  }

  const result = await addCollabComment(collaborationId, parsed.data.body, parentCommentId || undefined)
  if ("id" in result) {
    trackServer("collab_comment_added", { ok: true, collaborationId })
    return { ok: true }
  }
  if ((result as any).error === "rate_limited") return { formError: "You’re commenting too fast. Please wait a bit.", retryAfterSec: (result as any).retryAfterSec }
  trackServer("collab_comment_added", { ok: false, collaborationId, error: (result as any).error })
  return { formError: (result as any).error || "failed_to_add_comment" }
}

export type DeleteCollabCommentState = { formError?: string; ok?: true } | null

export async function deleteCollabCommentAction(_: DeleteCollabCommentState, formData: FormData): Promise<DeleteCollabCommentState> {
  const commentId = String(formData.get("commentId") || "").trim()
  if (!commentId) return { formError: "Missing comment id" }
  const result = await deleteCollabComment(commentId)
  if ("ok" in result) {
    trackServer("collab_comment_deleted", { ok: true, commentId })
    return { ok: true }
  }
  return { formError: (result as any).error || "failed_to_delete_comment" }
}

export type RequestCollabLogoUploadState = { formError?: string; uploadUrl?: string; path?: string; maxBytes?: number; mime?: string[] } | null
export async function requestCollabLogoUploadAction(_: RequestCollabLogoUploadState, formData: FormData): Promise<RequestCollabLogoUploadState> {
  const collabId = String(formData.get("collaborationId") || "").trim()
  const ext = String(formData.get("ext") || "").trim()
  if (!collabId || !ext) return { formError: "missing_params" }
  const res = await requestCollabLogoUpload(collabId, { ext })
  if ((res as any).error) return { formError: (res as any).error }
  return res as any
}

export type SetCollabLogoState = { formError?: string; ok?: true } | null
export async function setCollabLogoAction(_: SetCollabLogoState, formData: FormData): Promise<SetCollabLogoState> {
  const collabId = String(formData.get("collaborationId") || "").trim()
  const path = String(formData.get("path") || "").trim()
  if (!collabId || !path) return { formError: "missing_params" }
  const res = await setCollabLogo(collabId, path)
  if ((res as any).error) return { formError: (res as any).error }
  return { ok: true }
}


