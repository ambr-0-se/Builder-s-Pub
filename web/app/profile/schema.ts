import { z } from "zod"

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(80, "Display name must be 80 characters or less"),
  bio: z.string().max(4000, "Bio must be 4000 characters or less").optional().or(z.literal("")),
  githubUrl: z
    .string()
    .url("GitHub URL must be a valid HTTP/HTTPS URL")
    .startsWith("http", "GitHub URL must be a valid HTTP/HTTPS URL")
    .optional()
    .or(z.literal("")),
  linkedinUrl: z
    .string()
    .url("LinkedIn URL must be a valid HTTP/HTTPS URL")
    .startsWith("http", "LinkedIn URL must be a valid HTTP/HTTPS URL")
    .optional()
    .or(z.literal("")),
  websiteUrl: z
    .string()
    .url("Website URL must be a valid HTTP/HTTPS URL")
    .startsWith("http", "Website URL must be a valid HTTP/HTTPS URL")
    .optional()
    .or(z.literal("")),
  xUrl: z
    .string()
    .url("X URL must be a valid HTTP/HTTPS URL")
    .startsWith("http", "X URL must be a valid HTTP/HTTPS URL")
    .optional()
    .or(z.literal("")),
  region: z.string().max(120).optional().or(z.literal("")),
  timezone: z.string().max(120).optional().or(z.literal("")),
  skills: z
    .string()
    .optional()
    .or(z.literal("")),
  buildingNow: z.string().max(280).optional().or(z.literal("")),
  lookingFor: z.string().max(280).optional().or(z.literal("")),
  contact: z.string().max(200).optional().or(z.literal("")),
})


