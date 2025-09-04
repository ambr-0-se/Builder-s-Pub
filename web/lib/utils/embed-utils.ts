export type EmbedKind = "youtube" | "vercel" | "unsupported"

export interface ParsedEmbed {
  kind: EmbedKind
  embedUrl?: string
  originalUrl: string
}

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "youtu.be"])

const ALLOWED_EMBED_HOSTS = new Set<string>([
  ...YOUTUBE_HOSTS,
  "vercel.app",
])

export function isAllowedEmbedHost(hostname: string): boolean {
  if (YOUTUBE_HOSTS.has(hostname)) return true
  // allow any subdomain of vercel.app
  if (hostname === "vercel.app") return true
  if (hostname.endsWith(".vercel.app")) return true
  return false
}

export function parseEmbedUrl(rawUrl: string): ParsedEmbed {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return { kind: "unsupported", originalUrl: rawUrl }
  }

  if (!/^https?:$/.test(url.protocol)) {
    return { kind: "unsupported", originalUrl: rawUrl }
  }

  if (!isAllowedEmbedHost(url.hostname)) {
    return { kind: "unsupported", originalUrl: rawUrl }
  }

  // YouTube patterns
  if (YOUTUBE_HOSTS.has(url.hostname)) {
    // Formats supported:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID
    // - https://www.youtube.com/embed/VIDEO_ID
    let videoId = ""
    if (url.hostname === "youtu.be") {
      videoId = url.pathname.replace(/^\//, "")
    } else if (url.pathname.startsWith("/watch")) {
      videoId = url.searchParams.get("v") || ""
    } else if (url.pathname.startsWith("/embed/")) {
      videoId = url.pathname.split("/")[2] || ""
    }
    if (videoId) {
      const embed = new URL(`https://www.youtube.com/embed/${videoId}`)
      const t = url.searchParams.get("t") || url.searchParams.get("start")
      if (t) embed.searchParams.set("start", t)
      return { kind: "youtube", embedUrl: embed.toString(), originalUrl: rawUrl }
    }
  }

  // Vercel apps: allow embedding directly
  if (url.hostname === "vercel.app" || url.hostname.endsWith(".vercel.app")) {
    return { kind: "vercel", embedUrl: url.toString(), originalUrl: rawUrl }
  }

  return { kind: "unsupported", originalUrl: rawUrl }
}

export function getIframeSandbox(): string {
  // allow presentation for full screen; block top-navigation etc.
  return "allow-scripts allow-same-origin allow-popups allow-presentation"
}

export function getIframeReferrerPolicy(): React.HTMLAttributeReferrerPolicy {
  return "no-referrer"
}


