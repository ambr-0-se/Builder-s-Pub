export function validateTagInput(name: string, type: "technology" | "category") {
  const fieldErrors: Record<string, string> = {}
  const trimmed = (name || "").trim()
  if (!trimmed) {
    fieldErrors.name = "Name is required"
  } else if (trimmed.length > 50) {
    fieldErrors.name = "Name must be 50 characters or less"
  }
  if (type !== "technology" && type !== "category") {
    fieldErrors.type = "Invalid type"
  }
  return { fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined }
}
