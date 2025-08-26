import { z } from "zod"

export const createProjectSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, "Title is required")
		.max(160, "Title must be 160 characters or less"),
	tagline: z
		.string()
		.trim()
		.min(1, "Tagline is required")
		.max(140, "Tagline must be 140 characters or less"),
	description: z
		.string()
		.trim()
		.min(1, "Description is required")
		.max(4000, "Description must be 4000 characters or less"),
	demoUrl: z
		.string()
		.trim()
		.url("Demo URL must be a valid HTTP/HTTPS URL")
		.refine((u) => /^https?:\/\//.test(u), "Demo URL must be a valid HTTP/HTTPS URL"),
	sourceUrl: z
		.string()
		.trim()
		.url("Source URL must be a valid HTTP/HTTPS URL")
		.refine((u) => u === "" || /^https?:\/\//.test(u), "Source URL must be a valid HTTP/HTTPS URL")
		.optional()
		.or(z.literal("")),
	techTagIds: z.array(z.number()).min(1, "At least one technology tag is required"),
	categoryTagIds: z.array(z.number()).min(1, "At least one category tag is required"),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>


export const commentSchema = z.object({
	body: z
		.string()
		.trim()
		.min(1, "Comment cannot be empty")
		.max(1000, "Comment must be 1000 characters or less"),
})

export type CreateCommentInput = z.infer<typeof commentSchema>

