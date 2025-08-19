import { describe, it, expect } from "vitest"
import { profileSchema } from "../app/profile/schema"

describe("profileSchema", () => {
  it("accepts valid minimal data", () => {
    const parsed = profileSchema.safeParse({
      displayName: "Alice",
      bio: "",
      githubUrl: "",
      linkedinUrl: "",
      websiteUrl: "",
    })
    expect(parsed.success).toBe(true)
  })

  it("rejects empty display name", () => {
    const parsed = profileSchema.safeParse({
      displayName: " ",
      bio: "",
      githubUrl: "",
      linkedinUrl: "",
      websiteUrl: "",
    })
    expect(parsed.success).toBe(false)
  })

  it("rejects overly long display name", () => {
    const longName = "x".repeat(81)
    const parsed = profileSchema.safeParse({
      displayName: longName,
      bio: "",
      githubUrl: "",
      linkedinUrl: "",
      websiteUrl: "",
    })
    expect(parsed.success).toBe(false)
  })

  it("rejects non-http URLs", () => {
    const parsed = profileSchema.safeParse({
      displayName: "Bob",
      bio: "",
      githubUrl: "ftp://github.com/user",
      linkedinUrl: "mailto:a@b.com",
      websiteUrl: "not-a-url",
    })
    expect(parsed.success).toBe(false)
  })

  it("accepts valid http/https URLs", () => {
    const parsed = profileSchema.safeParse({
      displayName: "Bob",
      bio: "",
      githubUrl: "https://github.com/user",
      linkedinUrl: "https://linkedin.com/in/user",
      websiteUrl: "http://example.com",
    })
    expect(parsed.success).toBe(true)
  })
})


