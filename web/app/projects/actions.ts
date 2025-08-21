"use server"

import { redirect } from "next/navigation"
import { createProjectSchema } from "@/app/projects/schema"
import { createProject } from "@/lib/server/projects"

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


