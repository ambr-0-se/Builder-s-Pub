"use server"

import { redirect } from "next/navigation"
import { handleReport } from "@/lib/server/errors"

export type ReportProblemState = { formError?: string; success?: boolean }

export async function reportProblemAction(prevState: ReportProblemState | undefined, formData: FormData): Promise<ReportProblemState> {
  const userMessage = String(formData.get("message") || "").trim()
  const url = String(formData.get("url") || "")
  if (userMessage.length === 0) return { formError: "Please provide a brief description" }

  const result = await handleReport({ message: "user_report", userMessage, url }, new Request("http://local"))
  if ("error" in result) {
    if (result.error === "rate_limited") {
      return { formError: `Please try again in ${result.retryAfterSec ?? 60}s` }
    }
    return { formError: "Something went wrong. Please try again later." }
  }

  return { success: true }
}


