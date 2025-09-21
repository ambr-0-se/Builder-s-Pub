"use client"

import React, { useState, useRef } from "react"
import { LogoImage } from "@/components/ui/logo-image"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Camera, MoreHorizontal, X, Loader2 } from "lucide-react"
import { toPublicUrl } from "@/lib/publicUrl"
import { useToast } from "@/hooks/use-toast"

interface LogoChangeOverlayProps {
  src?: string
  alt: string
  size: number
  entity: "project" | "collab" | "profile"
  entityId: string
  isOwner: boolean
  requestAction: (prevState: any, formData: FormData) => Promise<{ uploadUrl?: string; path?: string; maxBytes?: number; mime?: string[]; formError?: string }>
  setAction: (prevState: any, formData: FormData) => Promise<{ ok?: true; formError?: string }>
  clearAction: (prevState: any, formData: FormData) => Promise<{ ok?: true; formError?: string }>
  rounded?: "none" | "sm" | "md" | "lg" | "full"
}

export function LogoChangeOverlay({
  src,
  alt,
  size,
  entity,
  entityId,
  isOwner,
  requestAction,
  setAction,
  clearAction,
  rounded = "md"
}: LogoChangeOverlayProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [pending, setPending] = useState(false)
  const [clearPending, setClearPending] = useState(false)
  const [localSrc, setLocalSrc] = useState<string | undefined>(src)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const MAX_BYTES = 1_000_000
  const ALLOWED = ["image/png", "image/jpeg", "image/svg+xml"]

  function openPicker() {
    if (pending || clearPending) return
    fileInputRef.current?.click()
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Reset input value so picking the same file twice still triggers onChange
    e.currentTarget.value = ""
    if (!file) return

    // Validate client-side
    if (!ALLOWED.includes(file.type)) {
      toast({ title: "Unsupported file type", description: "Use PNG, JPEG, or SVG (max 1MB)", variant: "destructive" as any })
      return
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "File too large", description: "Maximum file size is 1MB", variant: "destructive" as any })
      return
    }

    // Optimistic preview
    const previous = localSrc
    const previewUrl = URL.createObjectURL(file)
    setLocalSrc(previewUrl)
    setPending(true)

    try {
      const ext = (file.name.split(".").pop() || "").toLowerCase()
      const fdReq = new FormData()
      if (entity === "project") fdReq.set("projectId", entityId)
      if (entity === "collab") fdReq.set("collaborationId", entityId)
      fdReq.set("ext", ext)

      const init = await requestAction(null, fdReq)
      if (!init || !init.uploadUrl || !init.path) {
        throw new Error(init?.formError || "Failed to initialize upload")
      }

      const put = await fetch(init.uploadUrl, { method: "PUT", body: file, headers: { "content-type": file.type } })
      if (!put.ok) throw new Error("Upload failed")

      const fdSet = new FormData()
      if (entity === "project") fdSet.set("projectId", entityId)
      if (entity === "collab") fdSet.set("collaborationId", entityId)
      fdSet.set("path", init.path)
      const fin = await setAction(null, fdSet)
      if ((fin as any)?.formError) throw new Error((fin as any).formError)

      // Finalize: swap to public URL with cache-busting
      const finalUrl = (toPublicUrl(init.path) || "") + `?v=${Date.now()}`
      setLocalSrc(finalUrl)
    } catch (err: any) {
      console.error(err)
      setLocalSrc(previous)
      toast({ title: "Upload failed", description: err?.message || "Please try again.", variant: "destructive" as any })
    } finally {
      setPending(false)
      // Revoke preview URL if needed
      try { URL.revokeObjectURL(previewUrl) } catch {}
    }
  }

  const handleClearLogo = async () => {
    if (clearPending) return
    setClearPending(true)
    
    const formData = new FormData()
    if (entity === "project") {
      formData.set("projectId", entityId)
    } else {
      formData.set("collaborationId", entityId)
    }
    
    const result = await clearAction(null, formData)
    setClearPending(false)
    
    if (result?.ok) {
      // Swap to placeholder (LogoImage will fallback)
      setLocalSrc("")
    } else {
      console.error("Failed to clear logo:", result?.formError)
      toast({ title: "Failed to remove logo", description: result?.formError, variant: "destructive" as any })
    }
  }

  if (!isOwner) {
    // Non-owners just see the logo
    return <LogoImage src={src} alt={alt} size={size} rounded={rounded} />
  }

  return (
    <div
      className="relative group"
      data-testid="logo-overlay"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="sr-only"
        onChange={onFilePicked}
        data-testid="file-input"
      />

      <LogoImage src={localSrc} alt={alt} size={size} rounded={rounded} />
      
      {/* Pending overlay: always visible during upload (desktop + mobile) */}
      {pending && (
        <div
          className={`absolute inset-0 bg-black/50 rounded-${rounded} flex items-center justify-center z-10`}
          aria-live="polite"
          aria-busy="true"
          data-testid="uploading-overlay"
        >
          <div className="flex items-center gap-2 text-white text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
          </div>
        </div>
      )}

      {/* Desktop hover overlay */}
      <div
        className={`absolute inset-0 bg-black bg-opacity-50 rounded-${rounded} flex items-center justify-center transition-opacity duration-200 ${
          isHovered ? "opacity-100" : "opacity-0"
        } hidden sm:flex`}
      >
        {pending ? (
          <div className="flex items-center gap-2 text-white text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={openPicker}
            disabled={pending || clearPending}
            className="flex items-center gap-2"
            data-testid="change-btn"
          >
            <Camera className="h-4 w-4" />
            Change
          </Button>
        )}
      </div>

      {/* Mobile edit badge (always visible) */}
      <div className="absolute -bottom-1 -right-1 sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 rounded-full p-0"
              disabled={pending || clearPending}
              data-testid="mobile-edit-btn"
            >
              <Camera className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={openPicker}>
              <Camera className="h-4 w-4 mr-2" />
              Change Logo
            </DropdownMenuItem>
            {localSrc && (
              <DropdownMenuItem 
                onClick={handleClearLogo}
                disabled={clearPending}
                className="text-red-600"
                data-testid="remove-menu-item"
              >
                <X className="h-4 w-4 mr-2" />
                {clearPending ? "Removing..." : "Remove Logo"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop kebab menu for additional actions */}
      <div className="absolute top-2 right-2 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="h-6 w-6 p-0"
              disabled={pending || clearPending}
              data-testid="kebab-btn"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={openPicker}>
              <Camera className="h-4 w-4 mr-2" />
              Change Logo
            </DropdownMenuItem>
            {localSrc && (
              <DropdownMenuItem 
                onClick={handleClearLogo}
                disabled={clearPending}
                className="text-red-600"
                data-testid="remove-menu-item"
              >
                <X className="h-4 w-4 mr-2" />
                {clearPending ? "Removing..." : "Remove Logo"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
