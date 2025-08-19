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

  describe("buildingNow/lookingFor/contact limits", () => {
    it("accepts max-length values", () => {
      const max280 = "x".repeat(280)
      const max200 = "y".repeat(200)
      const parsed = profileSchema.safeParse({
        displayName: "Tester",
        bio: "",
        githubUrl: "",
        linkedinUrl: "",
        websiteUrl: "",
        buildingNow: max280,
        lookingFor: max280,
        contact: max200,
      })
      expect(parsed.success).toBe(true)
    })

    it("rejects overly long buildingNow and lookingFor (281)", () => {
      const tooLong = "x".repeat(281)
      const parsed = profileSchema.safeParse({
        displayName: "Tester",
        bio: "",
        githubUrl: "",
        linkedinUrl: "",
        websiteUrl: "",
        buildingNow: tooLong,
        lookingFor: tooLong,
        contact: "",
      })
      expect(parsed.success).toBe(false)
    })

    it("rejects overly long contact (201)", () => {
      const tooLong = "c".repeat(201)
      const parsed = profileSchema.safeParse({
        displayName: "Tester",
        bio: "",
        githubUrl: "",
        linkedinUrl: "",
        websiteUrl: "",
        contact: tooLong,
      })
      expect(parsed.success).toBe(false)
    })

    it("treats empty strings as optional for new fields", () => {
      const parsed = profileSchema.safeParse({
        displayName: "Tester",
        bio: "",
        githubUrl: "",
        linkedinUrl: "",
        websiteUrl: "",
        buildingNow: "",
        lookingFor: "",
        contact: "",
      })
      expect(parsed.success).toBe(true)
    })
  })
})


