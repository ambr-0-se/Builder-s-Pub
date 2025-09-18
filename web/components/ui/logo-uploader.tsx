"use client"

import React, { useState } from "react"

interface LogoUploaderProps {
  entity: "project" | "collab" | "profile"
  entityId?: string
  requestAction: (prevState: any, formData: FormData) => Promise<{ uploadUrl?: string; path?: string; maxBytes?: number; mime?: string[]; formError?: string }>
  setAction: (prevState: any, formData: FormData) => Promise<{ ok?: true; formError?: string }>
  currentPath?: string
}

const MAX_BYTES = 1_000_000
const ALLOWED = ["image/png", "image/jpeg", "image/svg+xml"]

export function LogoUploader({ entity, entityId, requestAction, setAction, currentPath }: LogoUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const f = e.target.files?.[0] || null
    if (!f) {
      setFile(null)
      setPreviewUrl(null)
      return
    }
    if (!ALLOWED.includes(f.type)) {
      setError("Unsupported file type. Use PNG, JPEG, or SVG.")
      return
    }
    if (f.size > MAX_BYTES) {
      setError("File too large. Max 1MB.")
      return
    }
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  async function onUpload() {
    try {
      setPending(true)
      setError(null)
      if (!file) {
        setError("Please choose a file.")
        return
      }
      const ext = (file.name.split(".").pop() || "").toLowerCase()
      const fdReq = new FormData()
      if (entity !== "profile" && entityId) {
        fdReq.set(entity === "project" ? "projectId" : "collaborationId", entityId)
      }
      fdReq.set("ext", ext)
      const res = await requestAction(null, fdReq)
      if (!res || !res.uploadUrl || !res.path) {
        setError(res?.formError || "Failed to initialize upload.")
        return
      }
      const put = await fetch(res.uploadUrl, { method: "PUT", body: file, headers: { "content-type": file.type } })
      if (!put.ok) {
        setError("Upload failed. Please try again.")
        return
      }
      const fdSet = new FormData()
      if (entity !== "profile" && entityId) {
        fdSet.set(entity === "project" ? "projectId" : "collaborationId", entityId)
      }
      fdSet.set("path", res.path)
      const fin = await setAction(null, fdSet)
      if ((fin as any)?.formError) {
        setError((fin as any).formError)
        return
      }
      // Success: refresh page to show new image
      if (typeof window !== "undefined") window.location.reload()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">PNG, JPEG, or SVG — max 1MB.</div>
      <input
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        onChange={onFileChange}
        disabled={pending}
      />
      {previewUrl && (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Preview" className="h-16 w-16 rounded border" />
        </div>
      )}
      {currentPath && !previewUrl && (
        <div className="mt-2 text-xs text-gray-500">Current: {currentPath}</div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button onClick={onUpload} disabled={pending || !file} className="px-3 py-2 text-sm bg-black text-white rounded disabled:opacity-50">
        {pending ? "Uploading..." : "Upload"}
      </button>
    </div>
  )
}
