"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { parseEmbedUrl, getIframeSandbox, getIframeReferrerPolicy } from "@/lib/utils/embed-utils"

interface DemoEmbedProps {
  url: string
  title?: string
  className?: string
}

export function DemoEmbed({ url, title = "Project demo", className }: DemoEmbedProps) {
  const parsed = useMemo(() => parseEmbedUrl(url), [url])

  if (parsed.kind === "unsupported" || !parsed.embedUrl) {
    return (
      <div className={cn("border border-gray-200 rounded-lg p-4 bg-white", className)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-900 font-medium">Demo</p>
            <p className="text-gray-600 text-sm">Open demo in a new tab</p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            View Demo
          </a>
        </div>
      </div>
    )
  }

  // Default aspect ratio for videos; for vercel apps, use a taller viewport
  const isVideo = parsed.kind === "youtube"
  const heightClass = isVideo ? "aspect-video" : "h-[600px]"

  return (
    <div className={cn("w-full overflow-hidden rounded-lg border border-gray-200 bg-white", className)}>
      <div className={cn("w-full", heightClass)}>
        <iframe
          title={title}
          src={parsed.embedUrl}
          className={cn(isVideo ? "w-full h-full" : "w-full h-[600px]")}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy={getIframeReferrerPolicy()}
          sandbox={getIframeSandbox()}
        />
      </div>
    </div>
  )
}


