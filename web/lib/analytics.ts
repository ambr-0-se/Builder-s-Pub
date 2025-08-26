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

export function useAnalyticsMock() {
  const track = (event: AnalyticsEvent, properties?: Record<string, any>) => {
    // TODO: Replace with real analytics service (e.g., Vercel Analytics, PostHog)
    console.log(`[Analytics] ${event}`, properties)
  }

  return { track }
}

// Server-safe tracker to avoid hook naming in server actions
export function trackServer(event: AnalyticsEvent, properties?: Record<string, any>) {
  // TODO: Replace with real analytics service when available
  console.log(`[Analytics] ${event}`, properties)
}
