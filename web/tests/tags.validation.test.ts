import { describe, it, expect } from "vitest"
import { validateTagInput } from "@/lib/validation/tags"

describe("validateTagInput", () => {
  it("requires name", () => {
    const { fieldErrors } = validateTagInput("", "technology")
    expect(fieldErrors?.name).toBeTruthy()
  })

  it("rejects long name", () => {
    const long = "x".repeat(51)
    const { fieldErrors } = validateTagInput(long, "technology")
    expect(fieldErrors?.name).toBeTruthy()
  })

  it("requires valid type", () => {
    const { fieldErrors } = validateTagInput("LLMs", "invalid" as any)
    expect(fieldErrors?.type).toBeTruthy()
  })

  it("accepts valid input", () => {
    const { fieldErrors } = validateTagInput("LLMs", "technology")
    expect(fieldErrors).toBeUndefined()
  })

  it("trims whitespace in name validation", () => {
    const { fieldErrors } = validateTagInput("  ", "technology")
    expect(fieldErrors?.name).toBeTruthy()
  })

  it("accepts maximum length name", () => {
    const maxLength = "x".repeat(50)
    const { fieldErrors } = validateTagInput(maxLength, "category")
    expect(fieldErrors).toBeUndefined()
  })
})
