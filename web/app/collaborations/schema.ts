import { z } from "zod"

export const lookingForItemSchema = z.object({
  role: z
    .string()
    .trim()
    .min(1, "Role is required")
    .max(80, "Role must be 80 characters or less"),
  amount: z
    .number()
    .int("Amount must be a whole number")
    .min(1, "Amount must be at least 1")
    .max(99, "Amount must be less than 100")
    .optional(),
  prerequisite: z
    .string()
    .trim()
    .max(400, "Prerequisite must be 400 characters or less")
    .optional()
    .or(z.literal("")),
  goodToHave: z
    .string()
    .trim()
    .max(400, "Good to have must be 400 characters or less")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(1200, "Description must be 1200 characters or less")
    .optional()
    .or(z.literal("")),
})

const createCollabBase = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(160, "Title must be 160 characters or less"),
  affiliatedOrg: z
    .string()
    .trim()
    .max(200, "Affiliated Organisation must be 200 characters or less")
    .optional()
    .or(z.literal("")),
  // kind removed from UI; server will default it for back-compat
  projectTypes: z
    .array(
      z.enum([
        "personal",
        "open_source",
        "research",
        "startup_idea_validation",
        "startup_registered",
        "student_organization",
        "university",
        "ngo",
        "corporate",
        "others",
      ])
    )
    .min(1, "Select at least one project type"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(4000, "Description must be 4000 characters or less"),
  stage: z.enum(
    [
      "ideation",
      "planning",
      "requirements_analysis",
      "design",
      "mvp_development",
      "testing_validation",
      "implementation_deployment",
      "monitoring_maintenance",
      "evaluation_closure",
      "scaling",
      "adding_features",
    ],
    { required_error: "Stage is required", invalid_type_error: "Stage is invalid" }
  ),
  lookingFor: z.array(lookingForItemSchema).min(1, "Add at least one role").max(5, "At most 5 roles"),
  contact: z
    .string()
    .trim()
    .min(1, "Contact is required")
    .max(200, "Contact must be 200 characters or less"),
  remarks: z
    .string()
    .trim()
    .max(1000, "Remarks must be 1000 characters or less")
    .optional()
    .or(z.literal("")),
  techTagIds: z.array(z.number()).min(1, "At least one technology tag is required"),
  categoryTagIds: z.array(z.number()).min(1, "At least one category tag is required"),
  logoPath: z
    .string()
    .trim()
    .optional()
    .refine((p) => !p || p.startsWith("collab-logos/"), "Invalid logo path"),
})

export const createCollabSchema = createCollabBase.superRefine((value, ctx) => {
    const techCount = value.techTagIds?.length || 0
    const catCount = value.categoryTagIds?.length || 0
    if (techCount > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You can select at most 5 technology tags",
        path: ["techTagIds"],
      })
    }
    if (catCount > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You can select at most 3 category tags",
        path: ["categoryTagIds"],
      })
    }
  })

export type CreateCollabInput = z.infer<typeof createCollabSchema>

export const updateCollabSchema = createCollabBase.partial().extend({
  // Optional id hint for internal usage (not from client forms)
  id: z.string().uuid().optional(),
  isHiring: z.boolean().optional(),
})

export type UpdateCollabInput = z.infer<typeof updateCollabSchema>

export const collabCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be 1000 characters or less"),
})

export type CreateCollabCommentInput = z.infer<typeof collabCommentSchema>


