"use server"

import { redirect } from "next/navigation"
import { createProjectSchema } from "@/app/projects/schema"
import { createProject } from "@/lib/server/projects"
import { addComment, deleteComment } from "@/lib/server/projects"
import { commentSchema } from "@/app/projects/schema"

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


export type AddCommentState = { fieldErrors?: Record<string, string>; formError?: string; ok?: true } | null

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
	if ("id" in result) return { ok: true }
	return { formError: (result as any).error || "failed_to_add_comment" }
}

export type DeleteCommentState = { formError?: string; ok?: true } | null

export async function deleteCommentAction(_: DeleteCommentState, formData: FormData): Promise<DeleteCommentState> {
	const commentId = String(formData.get("commentId") || "").trim()
	if (!commentId) return { formError: "Missing comment id" }

	const result = await deleteComment(commentId)
	if ("ok" in result) return { ok: true }
	return { formError: (result as any).error || "failed_to_delete_comment" }
}


