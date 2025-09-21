"use server"

import { redirect } from "next/navigation"
import { createProjectSchema } from "@/app/projects/schema"
import { createProject } from "@/lib/server/projects"
import { addComment, deleteComment, addReply, toggleCommentUpvote, toggleProjectUpvote, requestNewProjectLogoUpload } from "@/lib/server/projects"
import { commentSchema } from "@/app/projects/schema"
import { trackServer } from "@/lib/analytics"

export type CreateProjectState = { fieldErrors?: Record<string, string>; formError?: string } | null

export async function createProjectAction(_: CreateProjectState, formData: FormData): Promise<CreateProjectState> {
	// Collect arrays from multi-value inputs
	const techTagIds = formData.getAll("techTagIds").map((v) => Number(v)).filter((n) => Number.isFinite(n))
	const categoryTagIds = formData.getAll("categoryTagIds").map((v) => Number(v)).filter((n) => Number.isFinite(n))

	const parsed = createProjectSchema.safeParse({
		title: String(formData.get("title") || ""),
		tagline: String(formData.get("tagline") || ""),
		description: String(formData.get("description") || ""),
		demoUrl: String(formData.get("demoUrl") || ""),
		sourceUrl: String(formData.get("sourceUrl") || ""),
		techTagIds,
		categoryTagIds,
		logoPath: String(formData.get("logoPath") || "").trim() || undefined,
	})

	if (!parsed.success) {
		const fieldErrors: Record<string, string> = {}
		for (const issue of parsed.error.issues) {
			const key = issue.path[0] as string
			if (!fieldErrors[key]) fieldErrors[key] = issue.message
		}
		return { fieldErrors }
	}

	const result = await createProject(parsed.data)
	if ("id" in result) {
		redirect(`/projects/${result.id}?created=1`)
	}
	return result
}

export type AddCommentState = { fieldErrors?: Record<string, string>; formError?: string; ok?: true; retryAfterSec?: number } | null

export async function addCommentAction(_: AddCommentState, formData: FormData): Promise<AddCommentState> {
	// Validate inputs from form
	const projectId = String(formData.get("projectId") || "").trim()
	const body = String(formData.get("body") || "")

	const fieldErrors: Record<string, string> = {}
	if (!projectId) fieldErrors.projectId = "Missing project id"

	const parsed = commentSchema.safeParse({ body })
	if (!parsed.success) {
		for (const issue of parsed.error.issues) {
			const key = issue.path[0] as string
			if (!fieldErrors[key]) fieldErrors[key] = issue.message
		}
		return { fieldErrors }
	}

	const result = await addComment(projectId, parsed.data.body)
	if ("id" in result) {
		trackServer("comment_added", { ok: true, projectId })
		return { ok: true }
	}
	if ((result as any).error === "rate_limited") return { formError: "You’re commenting too fast. Please wait a bit.", retryAfterSec: (result as any).retryAfterSec }
	trackServer("comment_added", { ok: false, projectId, error: (result as any).error })
	return { formError: (result as any).error || "failed_to_add_comment" }
}

export type DeleteCommentState = { formError?: string; ok?: true } | null

export async function deleteCommentAction(_: DeleteCommentState, formData: FormData): Promise<DeleteCommentState> {
	const commentId = String(formData.get("commentId") || "").trim()
	if (!commentId) return { formError: "Missing comment id" }

	const result = await deleteComment(commentId)
	if ("ok" in result) {
		trackServer("comment_deleted", { ok: true, commentId })
		return { ok: true }
	}
	return { formError: (result as any).error || "failed_to_delete_comment" }
}

// Replies
export type AddReplyState = { fieldErrors?: Record<string, string>; formError?: string; ok?: true; retryAfterSec?: number } | null
export async function addReplyAction(_: AddReplyState, formData: FormData): Promise<AddReplyState> {
	const projectId = String(formData.get("projectId") || "").trim()
	const parentCommentId = String(formData.get("parentCommentId") || "").trim()
	const body = String(formData.get("body") || "")
	const fieldErrors: Record<string, string> = {}
	if (!projectId) fieldErrors.projectId = "Missing project id"
	if (!parentCommentId) fieldErrors.parentCommentId = "Missing parent comment id"
	if (Object.keys(fieldErrors).length > 0) return { fieldErrors }
	const result = await addReply(projectId, parentCommentId, body)
	if ("id" in result) {
		trackServer("reply_added", { ok: true, projectId, parentCommentId })
		return { ok: true }
	}
	if ((result as any).error === "rate_limited") return { formError: "You’re replying too fast. Please wait a bit.", retryAfterSec: (result as any).retryAfterSec }
	return { formError: (result as any).error || "failed_to_add_reply" }
}

// Upvotes toggle
export type ToggleUpvoteState = { formError?: string; ok?: true; upvoted?: boolean; retryAfterSec?: number } | null
export async function toggleCommentUpvoteAction(_: ToggleUpvoteState, formData: FormData): Promise<ToggleUpvoteState> {
	const commentId = String(formData.get("commentId") || "").trim()
	if (!commentId) return { formError: "Missing comment id" }
	const result = await toggleCommentUpvote(commentId)
	if ("ok" in result) {
		trackServer("upvote_toggled", { target: "comment", targetId: commentId, upvoted: result.upvoted })
		return { ok: true, upvoted: result.upvoted }
	}
	if ((result as any).error === "rate_limited") {
		trackServer("upvote_toggled", { target: "comment", targetId: commentId, limited: true, retryAfterSec: (result as any).retryAfterSec })
		return { formError: "Too many upvotes. Please slow down.", retryAfterSec: (result as any).retryAfterSec }
	}
	return { formError: (result as any).error || "failed_to_toggle_upvote" }
}

export async function toggleProjectUpvoteAction(_: ToggleUpvoteState, formData: FormData): Promise<ToggleUpvoteState> {
	const projectId = String(formData.get("projectId") || "").trim()
	if (!projectId) return { formError: "Missing project id" }
	const result = await toggleProjectUpvote(projectId)
	if ("ok" in result) {
		trackServer("upvote_toggled", { target: "project", targetId: projectId, upvoted: result.upvoted })
		return { ok: true, upvoted: result.upvoted }
	}
	if ((result as any).error === "rate_limited") {
		trackServer("upvote_toggled", { target: "project", targetId: projectId, limited: true, retryAfterSec: (result as any).retryAfterSec })
		return { formError: "Too many upvotes. Please slow down.", retryAfterSec: (result as any).retryAfterSec }
	}
	return { formError: (result as any).error || "failed_to_toggle_upvote" }
}

export type RequestProjectLogoUploadState = { formError?: string; uploadUrl?: string; path?: string; maxBytes?: number; mime?: string[] }
export async function requestProjectLogoUploadAction(_: RequestProjectLogoUploadState | null, formData: FormData): Promise<RequestProjectLogoUploadState> {
	const projectId = String(formData.get("projectId") || "").trim()
	const ext = String(formData.get("ext") || "").trim()
	if (!projectId || !ext) return { formError: "missing_params" }
	const res = await (await import("@/lib/server/projects")).requestProjectLogoUpload(projectId, { ext })
	if ((res as any).error) return { formError: (res as any).error }
	return res as any
}

export type RequestNewProjectLogoUploadState = { formError?: string; uploadUrl?: string; path?: string; maxBytes?: number; mime?: string[] } | null
export async function requestNewProjectLogoUploadAction(_: RequestNewProjectLogoUploadState, formData: FormData): Promise<RequestNewProjectLogoUploadState> {
	const ext = String(formData.get("ext") || "").trim()
	if (!ext) return { formError: "missing_params" }
	const res = await requestNewProjectLogoUpload({ ext })
	if ((res as any).error) return { formError: (res as any).error }
	return res as any
}

export type SetProjectLogoState = { formError?: string; ok?: true }
export async function setProjectLogoAction(_: SetProjectLogoState | null, formData: FormData): Promise<SetProjectLogoState> {
	const projectId = String(formData.get("projectId") || "").trim()
	const path = String(formData.get("path") || "").trim()
	if (!projectId || !path) return { formError: "missing_params" }
	const res = await (await import("@/lib/server/projects")).setProjectLogo(projectId, path)
	if ((res as any).error) return { formError: (res as any).error }
	return { ok: true }
}

export type ClearProjectLogoState = { formError?: string; ok?: true }
export async function clearProjectLogoAction(_: ClearProjectLogoState | null, formData: FormData): Promise<ClearProjectLogoState> {
	const projectId = String(formData.get("projectId") || "").trim()
	if (!projectId) return { formError: "missing_params" }
	const res = await (await import("@/lib/server/projects")).clearProjectLogo(projectId)
	if ((res as any).error) return { formError: (res as any).error }
	return { ok: true }
}


