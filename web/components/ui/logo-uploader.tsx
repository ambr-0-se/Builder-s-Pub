"use client"

import React, { useRef, useState } from "react"
import { deleteTempLogoAction } from "@/app/shared/actions/storage"

interface LogoUploaderProps {
  entity: "project" | "collab" | "profile"
  entityId?: string
  requestAction: (prevState: any, formData: FormData) => Promise<{ uploadUrl?: string; path?: string; maxBytes?: number; mime?: string[]; formError?: string }>
  setAction?: (prevState: any, formData: FormData) => Promise<{ ok?: true; formError?: string }>
  currentPath?: string
  onUploadedPath?: (path: string) => void
  preventReload?: boolean
  variant?: "dropzone" | "avatar"
  onPendingChange?: (pending: boolean) => void
}

const MAX_BYTES = 1_000_000
const ALLOWED = ["image/png", "image/jpeg", "image/svg+xml"]

export function LogoUploader({ entity, entityId, requestAction, setAction, currentPath, onUploadedPath, preventReload, variant = "dropzone", onPendingChange }: LogoUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [dragging, setDragging] = useState(false)
  const lastTempPathRef = useRef<string>("")

  function validateAndSetFile(f: File | null) {
    setError(null)
    if (!f) {
      setFile(null)
      setPreviewUrl(null)
      // Clear logoPath for create forms
      if (typeof onUploadedPath === "function") onUploadedPath("")
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
    // Auto-upload immediately
    autoUpload(f)
  }

  async function autoUpload(fileToUpload: File) {
    try {
      setPending(true)
      if (typeof onPendingChange === "function") onPendingChange(true)
      setError(null)
      const ext = (fileToUpload.name.split(".").pop() || "").toLowerCase()
      const fdReq = new FormData()
      if (entity !== "profile" && entityId) {
        fdReq.set(entity === "project" ? "projectId" : "collaborationId", entityId)
      }
      fdReq.set("ext", ext)
      // If we have a previously created temp path, delete it to reduce storage litter
      if (lastTempPathRef.current && lastTempPathRef.current.includes("/new/")) {
        const fdDel = new FormData()
        fdDel.set("path", lastTempPathRef.current)
        await deleteTempLogoAction(null, fdDel)
        lastTempPathRef.current = ""
      }
      const res = await requestAction(null, fdReq)
      if (!res || !res.uploadUrl || !res.path) {
        setError(res?.formError || "Failed to initialize upload.")
        return
      }
      // optional early surface of path to reduce race with submit
      if (typeof onUploadedPath === "function") onUploadedPath(res.path)
      // Track last temp path for cleanup on replacement (only for new/* keys)
      if (res.path.includes("/new/")) lastTempPathRef.current = res.path
      const put = await fetch(res.uploadUrl, { method: "PUT", body: fileToUpload, headers: { "content-type": fileToUpload.type } })
      if (!put.ok) {
        setError("Upload failed. Please try again.")
        return
      }
      if (typeof onUploadedPath === "function") onUploadedPath(res.path)
      if (!setAction) {
        // Create-form mode: no DB update needed
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
      if (!preventReload && typeof window !== "undefined") window.location.reload()
    } finally {
      setPending(false)
      if (typeof onPendingChange === "function") onPendingChange(false)
    }
  }

  const inputRef = useRef<HTMLInputElement | null>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    validateAndSetFile(f)
  }

  function clearFile() {
    setFile(null)
    setPreviewUrl(null)
    setError(null)
    // Clear logoPath for create forms
    if (typeof onUploadedPath === "function") onUploadedPath("")
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        onChange={onFileChange}
        disabled={pending}
        className="sr-only"
        aria-hidden
        ref={inputRef}
      />

      {variant === "dropzone" && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const f = e.dataTransfer.files?.[0]
            validateAndSetFile(f || null)
          }}
          className={`group relative rounded-md border-2 ${dragging ? "border-gray-800 bg-gray-50" : "border-dashed border-gray-300"} p-6 text-center cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2`}
          aria-label="Upload logo"
        >
          <div className="text-sm text-gray-800 font-medium">Drop your logo here, or browse</div>
          <div className="mt-1 text-xs text-gray-600">PNG, JPEG, or SVG — max 1MB.</div>

          {previewUrl && (
            <div className="mt-4 flex justify-center">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="h-24 w-24 rounded-md border object-cover object-center" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearFile() }}
                  disabled={pending}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                  aria-label="Remove file"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {currentPath && !previewUrl && (
        <div className="mt-1 text-xs text-gray-500">Current: {currentPath}</div>
      )}
      {error && (
        <div className="text-sm text-red-600" aria-live="polite">{error}</div>
      )}
      {pending && (
        <div className="text-xs text-gray-600" aria-live="polite">Uploading...</div>
      )}
    </div>
  )
}
