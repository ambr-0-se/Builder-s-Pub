type AnalyticsEvent =
  | "project_created"
  | "project_viewed"
  | "upvote_toggled"
  | "comment_added"
  | "comment_deleted"
  | "reply_added"
  | "collaboration_created"
  | "collaboration_updated"
  | "collaboration_deleted"
  | "collab_comment_added"
  | "collab_comment_deleted"
  | "collaboration_viewed"
  | "search_performed"
  | "filters_applied"

// Temporary normalization to support legacy names; Step 4 will align names at call sites
function normalizeEventName(event: string): string {
  switch (event) {
    case "project_created":
      return "project_create"
    case "project_viewed":
      return "project_view"
    case "collaboration_created":
      return "collab_create"
    case "filters_applied":
      return "filter_apply"
    default:
      return event
  }
}

function withCommonProps(properties?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!properties) return { ts: Date.now() }
  return { ts: Date.now(), ...properties }
}

export function useAnalytics() {
  const track = (event: AnalyticsEvent | string, properties?: Record<string, unknown>) => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const name = normalizeEventName(event)
    const props = withCommonProps(properties)
    if (!key) {
      if (process.env.NODE_ENV !== "production") console.log(`[Analytics] ${name}`, props)
      return
    }
    // Lazy import so this module is safe to import server-side
    import("posthog-js").then(({ default: posthog }) => {
      try {
        posthog.capture(name, props)
      } catch (err) {
        if (process.env.NODE_ENV !== "production") console.warn("[Analytics] capture failed", err)
      }
    })
  }
  return { track }
}

// Keep the mock for compatibility; will be removed when call sites are migrated in Step 6
export function useAnalyticsMock() {
  const track = (event: AnalyticsEvent, properties?: Record<string, unknown>) => {
    const name = normalizeEventName(event)
    const props = withCommonProps(properties)
    console.log(`[Analytics] ${name}`, props)
  }
  return { track }
}

// Server-safe tracker to avoid hook naming in server actions
export function trackServer(event: AnalyticsEvent | string, properties?: Record<string, unknown>) {
  const name = normalizeEventName(event)
  const props = withCommonProps(properties)
  const isServer = typeof window === "undefined"
  if (!isServer) {
    if (process.env.NODE_ENV !== "production") console.warn("[Analytics][server] called on client; ignoring", { name })
    return
  }
  // Structured logging for server actions; future: send to provider using server-friendly client
  try {
    console.log(`[Analytics][server] ${name}`, props)
  } catch {
    // Avoid throwing inside server actions
  }
}
