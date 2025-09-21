"use server"

import { deleteTempLogo } from "@/lib/server/storage-cleanup"

export type DeleteTempLogoState = { ok?: true; formError?: string }

export async function deleteTempLogoAction(_: DeleteTempLogoState | null, formData: FormData): Promise<DeleteTempLogoState> {
  const path = String(formData.get("path") || "").trim()
  if (!path) return { formError: "missing_params" }
  const res = await deleteTempLogo(path)
  if ((res as any).error) return { formError: (res as any).error }
  return { ok: true }
}


