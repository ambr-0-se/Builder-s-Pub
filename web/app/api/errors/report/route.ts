import { NextResponse } from "next/server"
import { handleReport, type ReportInput } from "@/lib/server/errors"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReportInput
    const result = await handleReport(body, req)
    if ("error" in result) {
      if (result.error === "rate_limited") {
        return NextResponse.json(result, { status: 429 })
      }
      return NextResponse.json(result, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 })
  }
}


